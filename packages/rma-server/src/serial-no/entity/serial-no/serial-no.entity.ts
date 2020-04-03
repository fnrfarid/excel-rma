import {
  Column,
  ObjectIdColumn,
  BaseEntity,
  ObjectID,
  Entity,
  Index,
} from 'typeorm';

export class Warranty {
  purchaseWarrantyDate: string;
  salesWarrantyDate: string;
  purchasedOn: Date;
  soldOn: Date;
}
@Entity()
export class SerialNo extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  uuid: string;

  @Column()
  name: string;

  @Column()
  owner: string;

  @Column()
  creation: string;

  @Column()
  modified: string;

  @Column()
  modified_by: string;

  @Column()
  idx: number;

  @Column()
  docstatus: number;

  @Column()
  @Index({ unique: true })
  serial_no: string;

  @Column()
  item_code: string;

  @Column()
  item_name: string;

  @Column()
  description: string;

  @Column()
  item_group: string;

  @Column()
  purchase_time: string;

  @Column()
  purchase_rate: number;

  @Column()
  supplier: string;

  @Column()
  supplier_name: string;

  @Column()
  asset_status: string;

  @Column()
  delivery_time: string;

  @Column()
  is_cancelled: string;

  @Column()
  customer: string;

  @Column()
  customer_name: string;

  @Column()
  warranty_expiry_date: string;

  @Column()
  maintenance_status: string;

  @Column()
  warranty_period: number;

  @Column()
  warehouse: string;

  @Column()
  serial_no_details: string;

  @Column()
  delivery_note: string;

  @Column()
  purchase_document_no: string;

  @Column()
  purchase_document_type: string;

  @Column()
  company: string;

  @Column()
  warranty: Warranty;

  @Column()
  doctype: string;

  @Column()
  isSynced: boolean;

  @Column()
  purchase_date: string;
}
