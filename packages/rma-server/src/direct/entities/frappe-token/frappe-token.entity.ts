import { Entity, BaseEntity, ObjectIdColumn, Column, ObjectID } from 'typeorm';
import * as uuidv4 from 'uuid/v4';

@Entity()
export class FrappeToken extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;
  @Column()
  accessToken: string;
  @Column()
  uuid: string;
  @Column()
  active: boolean;
  @Column()
  exp: number;
  @Column()
  sub: string;
  @Column()
  scope: string[];
  @Column()
  roles: string[];
  @Column()
  clientId: string;
  @Column()
  refreshToken: string;
  @Column()
  trustedClient: boolean;
  @Column()
  username: string;
  @Column()
  expirationTime: Date;
  @Column()
  idToken: string;
  constructor() {
    super();
    if (!this.uuid) this.uuid = uuidv4();
  }
}
