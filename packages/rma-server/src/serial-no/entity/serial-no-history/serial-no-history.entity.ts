import { Column, ObjectIdColumn, BaseEntity, ObjectID, Entity } from 'typeorm';

export class Warranty {
  purchaseWarrantyDate: string;
  salesWarrantyDate: Date;
  purchasedOn: Date;
  soldOn: Date;
}
export class QueueState {
  purchase_receipt: {
    parent: string;
    warehouse: string;
  };
  delivery_note: {
    parent: string;
    warehouse: string;
  };
  stock_entry: {
    parent: string;
    source_warehouse: string;
    target_warehouse: string;
  };
}

@Entity()
export class SerialNoHistory extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  eventDate: Date;

  @Column()
  eventType: EventType;

  @Column()
  uuid: string;

  @Column()
  isSynced: boolean;

  @Column()
  warranty_expiry_date: string;

  @Column()
  modified: boolean;

  @Column()
  name: string;

  @Column()
  owner: string;

  @Column()
  creation: string;

  @Column()
  sales_invoice_name: string;

  @Column()
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
  customer: string;

  @Column()
  warehouse: string;

  @Column()
  delivery_note: string;

  @Column()
  purchase_document_no: string;

  @Column()
  sales_return_name: string;

  @Column()
  purchase_document_type: string;

  @Column()
  company: string;

  @Column()
  warranty: Warranty;

  @Column()
  purchase_date: string;

  @Column()
  queue_state: QueueState;

  @Column()
  purchase_invoice_name: string;

  @Column()
  brand: string;
}

export enum EventType {
  InsertSerial = 'InsertSerial',
  UpdateSerial = 'UpdateSerial',
  DeleteSerial = 'DeleteSerial',
}
