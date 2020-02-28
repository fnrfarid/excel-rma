import { Column, ObjectIdColumn, BaseEntity, ObjectID, Entity } from 'typeorm';

@Entity()
export class WarrantyClaim extends BaseEntity {
  @Column()
  uuid: string;

  @Column()
  modifiedOn: Date;

  @Column()
  createdOn: Date;

  @Column()
  serialNo: string;

  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  claim_no: string;

  @Column()
  claim_type: string;

  @Column()
  received_date: Date;

  @Column()
  deliver_date: Date;

  @Column()
  customer_third_party: string;

  @Column()
  item_code: string;

  @Column()
  claimed_serial: string;

  @Column()
  invoice_no: string;

  @Column()
  service_charge: string;

  @Column()
  claim_status: string;

  @Column()
  warranty_status: string;

  @Column()
  receiving_branch: string;

  @Column()
  delivery_branch: string;

  @Column()
  received_by: string;

  @Column()
  delivered_by: string;
}
