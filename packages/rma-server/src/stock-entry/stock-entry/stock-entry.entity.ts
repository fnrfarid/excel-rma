import { Column, BaseEntity, Entity, ObjectID, ObjectIdColumn } from 'typeorm';

@Entity()
export class StockEntry extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  uuid: string;

  @Column()
  docstatus?: 1;

  @Column()
  createdOn: string;

  @Column()
  created_by_email: string;

  @Column()
  createdByEmail: string;

  @Column()
  createdBy: string;

  @Column()
  stock_entry_type: string;

  @Column()
  company: string;

  @Column()
  posting_date: string;

  @Column()
  posting_time: string;

  @Column()
  doctype: string;

  @Column()
  inQueue: boolean;

  @Column()
  isSynced: boolean;

  @Column()
  items: StockEntryItem[];
}

export class StockEntryItem {
  s_warehouse: string;
  t_warehouse: string;
  item_code: string;
  item_name: string;
  qty: number;
  transfer_qty: number;
  transferWarehouse: string;
  serial_no: any;
}
