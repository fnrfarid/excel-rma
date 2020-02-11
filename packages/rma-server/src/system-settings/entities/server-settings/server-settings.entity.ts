import { Column, Entity, BaseEntity, ObjectID, ObjectIdColumn } from 'typeorm';
import * as uuidv4 from 'uuid/v4';
import { SERVICE } from '../../../constants/app-strings';

@Entity()
export class ServerSettings extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  uuid: string;

  @Column()
  appURL: string;

  @Column()
  authServerURL: string;

  @Column()
  frontendClientId: string;

  @Column()
  backendClientId: string;

  @Column()
  serviceAccountUser: string;

  @Column()
  serviceAccountSecret: string;

  @Column()
  profileURL: string;

  @Column()
  tokenURL: string;

  @Column()
  authorizationURL: string;

  @Column()
  revocationURL: string;

  @Column()
  service: string = SERVICE;

  @Column()
  cloudStorageSettings: string;

  @Column()
  callbackProtocol: string;

  @Column()
  clientTokenUuid: string;

  @Column()
  scope: string[];

  @Column()
  webhookApiKey: string;

  @Column()
  frontendCallbackURLs: string[];

  @Column()
  backendCallbackURLs: string[];

  @Column()
  defaultCompany: string;

  @Column()
  sellingPriceList: string;

  @Column()
  timeZone: string;

  @Column()
  validateStock: boolean;

  constructor() {
    super();
    if (!this.uuid) this.uuid = uuidv4();
  }
}
