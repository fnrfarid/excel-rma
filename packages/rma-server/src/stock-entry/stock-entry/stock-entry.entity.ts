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
  names: string[];

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
  status: string;

  @Column()
  createdAt: Date;

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
  description: string;

  @Column()
  type: string;

  @Column()
  remarks: string;

  @Column()
  territory: string;

  @Column()
  warrantyClaimUuid: string;

  @Column()
  stock_voucher_number: string;

  @Column()
  items: StockEntryItem[];
}

export class StockEntryItem {
  s_warehouse: string;
  t_warehouse: string;
  item_code: string;
  item_name: string;
  qty: number;
  has_serial_no: number;
  transfer_qty: number;
  transferWarehouse: string;
  serial_no: string[];
}
