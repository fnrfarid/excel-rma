import {
  Injectable,
  OnModuleInit,
  HttpService,
  Logger,
  Inject,
} from '@nestjs/common';
import * as Agenda from 'agenda';
import { from, forkJoin, of } from 'rxjs';
import { map, concatMap, switchMap } from 'rxjs/operators';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { CustomerService } from '../../entity/customer/customer.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import {
  FRAPPE_API_GET_CUSTOMER_ENDPOINT,
  ERPNEXT_CUSTOMER_CREDIT_LIMIT_ENDPOINT,
} from '../../../constants/routes';
import {
  CONTENT_TYPE,
  APPLICATION_JSON_CONTENT_TYPE,
  ACCEPT,
} from '../../../constants/app-strings';
import {
  RESET_CREDIT_LIMIT_SUCCESS,
  RESET_CREDIT_LIMIT_ERROR,
} from '../../../constants/messages';
import { AGENDA_TOKEN } from '../../../system-settings/providers/agenda.provider';

export const RESET_CUSTOMER_CREDIT_LIMIT = 'RESET_CUSTOMER_CREDIT_LIMIT';
@Injectable()
export class ResetCreditLimitService implements OnModuleInit {
  constructor(
    @Inject(AGENDA_TOKEN)
    private readonly agenda: Agenda,
    private readonly settings: SettingsService,
    private readonly customer: CustomerService,
    private readonly clientToken: ClientTokenManagerService,
    private readonly http: HttpService,
  ) {}

  async onModuleInit() {
    this.agenda.define(RESET_CUSTOMER_CREDIT_LIMIT, (job, done) => {
      const now = new Date();

      this.resetCreditLimit(now)
        .toPromise()
        .then(success => {
          Logger.log(RESET_CREDIT_LIMIT_SUCCESS, this.constructor.name);
          return done();
        })
        .catch(error => {
          Logger.error(RESET_CREDIT_LIMIT_ERROR, this.constructor.name);
          return done(error);
        });
    });

    await this.agenda.every('1 minutes', RESET_CUSTOMER_CREDIT_LIMIT);
  }

  resetCreditLimit(now) {
    const state: any = {};
    return from(
      this.customer.find({
        baseCreditLimitAmount: { $exists: true },
        tempCreditLimitPeriod: { $lte: now },
      }),
    ).pipe(
      switchMap(customers => from(customers)),
      concatMap(single_customer => {
        this.customer
          .updateOne(
            { uuid: single_customer.uuid },
            { $unset: { tempCreditLimitPeriod: '' } },
          )
          .then(success => {})
          .catch(error => {});
        return forkJoin({
          settings: this.settings.find(),
          headers: this.clientToken.getServiceAccountApiHeaders(),
          customer: of(single_customer),
        });
      }),
      switchMap(({ settings, headers, customer }) => {
        state.settings = settings;
        state.customer = customer;
        headers[CONTENT_TYPE] = APPLICATION_JSON_CONTENT_TYPE;
        headers[ACCEPT] = APPLICATION_JSON_CONTENT_TYPE;
        state.headers = headers;
        return this.http.get(
          settings.authServerURL +
            FRAPPE_API_GET_CUSTOMER_ENDPOINT +
            '/' +
            customer.name,
          { headers },
        );
      }),
      map(res => res.data),
      switchMap(erpnextCustomer => {
        const creditLimits: any[] = erpnextCustomer.credit_limits || [];

        for (const limit of creditLimits) {
          if (limit.company === state.settings.defaultCompany) {
            return this.http.put(
              state.settings.authServerURL +
                ERPNEXT_CUSTOMER_CREDIT_LIMIT_ENDPOINT +
                '/' +
                limit.name,
              {
                credit_limit: state.customer.baseCreditLimitAmount,
              },
              { headers: state.headers },
            );
          }
        }

        creditLimits.push({
          credit_limit: state.customer.baseCreditLimitAmount,
          company: state.settings.defaultCompany,
        });
        return this.http.put(
          state.settings.authServerURL +
            FRAPPE_API_GET_CUSTOMER_ENDPOINT +
            '/' +
            state.customer.name,
          { credit_limits: creditLimits },
          { headers: state.headers },
        );
      }),
    );
  }

  getPureError(error) {
    if (error && error.response) {
      error = error.response.data ? error.response.data : error.response;
    }
    try {
      return JSON.parse(JSON.stringify(error, this.replaceErrors));
    } catch {
      return error.data ? error.data : error;
    }
  }

  replaceErrors(keys, value) {
    if (value instanceof Error) {
      const error = {};

      Object.getOwnPropertyNames(value).forEach(key => {
        error[key] = value[key];
      });

      return error;
    }

    return value;
  }
}
