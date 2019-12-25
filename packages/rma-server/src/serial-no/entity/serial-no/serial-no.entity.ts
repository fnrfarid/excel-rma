import { Column, ObjectIdColumn, BaseEntity, ObjectID, Entity } from 'typeorm';

@Entity()
export class SerialNo extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  uuid: string;

  @Column()
  serial_no: string;

  @Column()
  item_code: string;

  @Column()
  warranty_expiry_date: string;

  @Column()
  company: string;

  @Column()
  isSynced: boolean;
}
