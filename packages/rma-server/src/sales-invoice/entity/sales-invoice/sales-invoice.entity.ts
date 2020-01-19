import { Column, ObjectIdColumn, BaseEntity, ObjectID, Entity } from 'typeorm';

@Entity()
export class SalesInvoice extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  uuid: string;

  @Column()
  name: string;

  @Column()
  title: string;

  @Column()
  customer: string;

  @Column()
  company: string;

  @Column()
  posting_date: string;

  @Column()
  posting_time: string;

  @Column()
  set_posting_time: number;

  @Column()
  due_date: string;

  @Column()
  address_display: string;

  @Column()
  contact_person: string;

  @Column()
  contact_display: string;

  @Column()
  contact_email: string;

  @Column()
  territory: string;

  @Column()
  update_stock: number;

  @Column()
  total_qty: number;

  @Column()
  base_total: number;

  @Column()
  base_net_total: number;

  @Column()
  total: number;

  @Column()
  net_total: number;

  @Column()
  pos_total_qty: number;

  @Column()
  items: Item[];

  @Column()
  delivery_note_items: any[] = [];

  @Column()
  pricing_rules: [];

  @Column()
  packed_items: [];

  @Column()
  timesheets: [];

  @Column()
  taxes: Tax[];

  @Column()
  advances: [];

  @Column()
  payment_schedule: [];

  @Column()
  payments: [];

  @Column()
  sales_team: [];

  @Column()
  submitted: boolean;

  @Column()
  inQueue: boolean;

  @Column()
  isSynced: boolean;
}

export class Tax {
  name: string;
  charge_type: string;
  tax_amount: number;
  total: number;
  account_head: string;
  description: string;
  rate: number;
}

export class Item {
  name: string;
  owner: string;
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
}
