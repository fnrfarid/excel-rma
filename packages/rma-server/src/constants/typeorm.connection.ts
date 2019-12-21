import {
  ConfigService,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_NAME,
  MONGO_URI_PREFIX,
  CACHE_DB_USER,
  CACHE_DB_PASSWORD,
  CACHE_DB_NAME,
} from '../config/config.service';
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions';
import { ServerSettings } from '../system-settings/entities/server-settings/server-settings.entity';
import { TokenCache } from '../auth/entities/token-cache/token-cache.entity';
import { FrappeToken } from '../direct/entities/frappe-token/frappe-token.entity';
import { RequestState } from '../direct/entities/request-state/request-state.entity';
import { Customer } from '../customer/entity/customer/customer.entity';
import { Item } from '../item/entity/item/item.entity';
import { Supplier } from '../supplier/entity/supplier/supplier.entity';

export const TOKEN_CACHE_CONNECTION = 'tokencache';
export const DEFAULT = 'default';

export function connectTypeORM(config: ConfigService): MongoConnectionOptions {
  const mongoUriPrefix = config.get(MONGO_URI_PREFIX) || 'mongodb';
  const mongoOptions = 'retryWrites=true';
  return {
    name: DEFAULT,
    url: `${mongoUriPrefix}://${config.get(DB_USER)}:${config.get(
      DB_PASSWORD,
    )}@${config.get(DB_HOST)}/${config.get(DB_NAME)}?${mongoOptions}`,
    type: 'mongodb',
    logging: false,
    synchronize: true,
    entities: [
      ServerSettings,
      FrappeToken,
      RequestState,
      Customer,
      Item,
      Supplier,
    ],
    useNewUrlParser: true,
    w: 'majority',
    useUnifiedTopology: true,
  };
}

export function connectTypeORMTokenCache(
  config: ConfigService,
): MongoConnectionOptions {
  const mongoUriPrefix = config.get(MONGO_URI_PREFIX) || 'mongodb';
  const mongoOptions = 'retryWrites=true';
  return {
    name: TOKEN_CACHE_CONNECTION,
    url: `${mongoUriPrefix}://${config.get(CACHE_DB_USER)}:${config.get(
      CACHE_DB_PASSWORD,
    )}@${config.get(DB_HOST)}/${config.get(CACHE_DB_NAME)}?${mongoOptions}`,
    type: 'mongodb',
    logging: false,
    synchronize: true,
    entities: [TokenCache],
    useNewUrlParser: true,
    w: 'majority',
    useUnifiedTopology: true,
  };
}
