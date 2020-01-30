import {
  Injectable,
  NotFoundException,
  HttpService,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { switchMap, catchError } from 'rxjs/operators';
import { throwError, from, of, Observable } from 'rxjs';
import * as uuidv4 from 'uuid/v4';
import { TerritoryService } from '../../entity/territory/territory.service';
import { Territory } from '../../entity/territory/territory.entity';
import { TerritoryDto } from '../../entity/territory/territory-dto';
import { UpdateTerritoryDto } from '../../entity/territory/update-territory-dto';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';
import { ClientTokenManagerService } from '../../../auth/aggregates/client-token-manager/client-token-manager.service';
import {
  API_RESOURCE_TERRITORY,
  ERPNEXT_API_WAREHOUSE_ENDPOINT,
} from '../../../constants/routes';
import {
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
} from '../../../constants/app-strings';

@Injectable()
export class TerritoryAggregateService {
  constructor(
    private readonly territory: TerritoryService,
    private readonly http: HttpService,
    private readonly settings: SettingsService,
    private readonly clientToken: ClientTokenManagerService,
  ) {}

  addTerritory(territoryPayload: TerritoryDto) {
    const territory = new Territory();
    territory.uuid = uuidv4();
    Object.assign(territory, territoryPayload);
    return this.checkLocalTerritoryAndWarehouse(territory).pipe(
      switchMap(success => {
        return from(this.territory.create(territory));
      }),
    );
  }

  async retrieveTerritory(uuid: string) {
    const territory = await this.territory.findOne({ uuid });
    if (!territory) throw new NotFoundException();
    return territory;
  }

  async getTerritoryList(offset, limit, search, sort) {
    return await this.territory.list(
      Number(offset),
      Number(limit),
      search,
      sort,
    );
  }

  async removeTerritory(uuid: string) {
    const territoryFound = await this.territory.findOne({ uuid });
    if (!territoryFound) {
      throw new NotFoundException();
    }
    return await this.territory.deleteOne({ uuid: territoryFound.uuid });
  }

  updateTerritory(updatePayload: UpdateTerritoryDto) {
    return from(
      this.territory.findOne({
        uuid: updatePayload.uuid,
      }),
    ).pipe(
      switchMap(territory => {
        if (!territory) {
          return throwError(new NotFoundException());
        }
        const territoryPayload = Object.assign(territory, updatePayload);
        return this.checkLocalTerritoryAndWarehouse(territoryPayload).pipe(
          switchMap(success => {
            return from(
              this.territory.updateOne(
                { uuid: updatePayload.uuid },
                { $set: territoryPayload },
              ),
            );
          }),
        );
      }),
    );
  }

  checkLocalTerritoryAndWarehouse(territory: Territory): Observable<boolean> {
    return this.settings.find().pipe(
      switchMap(settings => {
        return this.clientToken.getClientToken().pipe(
          switchMap(token => {
            const headers = {
              [AUTHORIZATION]: BEARER_HEADER_VALUE_PREFIX + token.accessToken,
            };
            return this.http
              .get(
                settings.authServerURL +
                  API_RESOURCE_TERRITORY +
                  '/' +
                  territory.name,
                { headers },
              )
              .pipe(
                switchMap(success => {
                  return this.http.get(
                    settings.authServerURL +
                      ERPNEXT_API_WAREHOUSE_ENDPOINT +
                      '/' +
                      territory.warehouse,
                    { headers },
                  );
                }),
              );
          }),
          catchError(error => {
            return throwError(new InternalServerErrorException(error));
          }),
          switchMap(response => {
            return this.findTerritoryByNameAndWarehouse(
              territory.name,
              territory.warehouse,
            );
          }),
          switchMap(localTerritory => {
            if (localTerritory) {
              return throwError(
                new BadRequestException({
                  territoryExists: true,
                  localTerritory,
                }),
              );
            }
            return of(true);
          }),
        );
      }),
    );
  }

  findTerritoryByNameAndWarehouse(name: string, warehouse: string) {
    return from(this.territory.findOne({ name, warehouse }));
  }
}