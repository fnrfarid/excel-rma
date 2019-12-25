import {
  Injectable,
  BadRequestException,
  HttpService,
  NotImplementedException,
} from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import {
  CustomerWebhookInterface,
  CreditLimitsInterface,
} from '../../entity/customer/customer-webhook-interface';
import { CustomerService } from '../../entity/customer/customer.service';
import { from, throwError, of } from 'rxjs';
import { switchMap, map, retry } from 'rxjs/operators';
import { CUSTOMER_ALREADY_EXISTS } from '../../../constants/app-strings';
import { Customer } from '../../entity/customer/customer.entity';
import * as uuidv4 from 'uuid/v4';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { FRAPPE_API_GET_CUSTOMER_ENDPOINT } from '../../../constants/routes';

@Injectable()
export class CustomerWebhookAggregateService extends AggregateRoot {
  constructor(
    private readonly customerService: CustomerService,
    private readonly clientTokenManager: ClientTokenManagerService,
    private readonly http: HttpService,
    private readonly settingsService: SettingsService,
  ) {
    super();
  }

  customerCreated(customerWebhookPayload: CustomerWebhookInterface) {
    return from(
      this.customerService.findOne({ owner: customerWebhookPayload.owner }),
    ).pipe(
      switchMap(customer => {
        if (customer) {
          return throwError(new BadRequestException(CUSTOMER_ALREADY_EXISTS));
        }
        const provider = this.mapCustomer(customerWebhookPayload);
        this.customerService
          .create(provider)
          .then(success => {})
          .catch(error => {});
        this.syncCustomerCredit(provider);
        return of({});
      }),
    );
  }

  mapCustomer(customerPayload: CustomerWebhookInterface) {
    const customer = new Customer();
    Object.assign(customer, customerPayload);
    customer.uuid = uuidv4();
    customer.isSynced = false;
    return customer;
  }

  syncCustomerCredit(customer: Customer) {
    return this.settingsService
      .find()
      .pipe(
        switchMap(settings => {
          if (!settings.authServerURL) {
            return throwError(new NotImplementedException());
          }
          return this.clientTokenManager.getClientToken().pipe(
            switchMap(token => {
              const url =
                settings.authServerURL +
                FRAPPE_API_GET_CUSTOMER_ENDPOINT +
                customer.name;
              return this.http
                .get(url, {
                  headers: this.settingsService.getAuthorizationHeaders(token),
                })
                .pipe(
                  map(data => data.data.data),
                  switchMap(
                    (response: { credit_limits: CreditLimitsInterface[] }) => {
                      const customerCredit = this.mapCustomerCredit(
                        response.credit_limits,
                      );
                      return this.customerService.updateOne(
                        { uuid: customer.uuid },
                        {
                          $set: {
                            credit_limits: customerCredit,
                            isSynced: true,
                          },
                        },
                      );
                    },
                  ),
                );
            }),
            retry(3),
          );
        }),
      )
      .subscribe({
        next: success => {},
        error: err => {},
      });
  }

  mapCustomerCredit(customerCredit: CreditLimitsInterface[]) {
    const sanitizedData = [];
    customerCredit.forEach(eachCustomerCredit => {
      sanitizedData.push({
        credit_limit: eachCustomerCredit.credit_limit,
        company: eachCustomerCredit.company,
      });
    });
    return sanitizedData;
  }

  customerDeleted(customer: CustomerWebhookInterface) {
    return from(this.customerService.deleteOne({ owner: customer.owner }));
  }

  customerUpdated(customerPayload: CustomerWebhookInterface) {
    return from(
      this.customerService.findOne({ owner: customerPayload.owner }),
    ).pipe(
      switchMap(customer => {
        if (!customer) {
          this.customerCreated(customerPayload).subscribe({
            next: success => {},
            error: err => {},
          });
          return of();
        }
        customer.isSynced = true;
        this.customerService
          .updateOne({ uuid: customer.uuid }, { $set: customerPayload })
          .then(success => {})
          .catch(err => {});
        this.syncCustomerCredit(customer);
        return of();
      }),
    );
  }
}
