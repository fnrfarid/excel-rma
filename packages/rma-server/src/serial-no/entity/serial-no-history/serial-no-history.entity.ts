import {
  Column,
  ObjectIdColumn,
  BaseEntity,
  ObjectID,
  Entity,
  Index,
} from 'typeorm';

@Entity()
export class SerialNoHistory extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  eventDate: Date;

  @Column()
  eventType: EventType;

  @Column()
  @Index()
  serial_no: string;

  @Column()
  document_no: string;

  @Column()
  transaction_from: string;

  @Column()
  transaction_to: string;

  @Column()
  document_type: string;

  @Column()
  parent_document: string;

  @Column()
  created_on: string;

  @Column()
  created_by: string;
}

export enum EventType {
  SerialPurchased = 'Serial Purchased',
  SerialDelivered = 'Serial Delivered',
  SerialReturned = 'Serial Returned',
  SerialTransferCreated = 'Serial Transfer Created',
  SerialTransferAccepted = 'Serial Transfer Accepted',
  SerialTransferRejected = 'Serial Transfer Rejected',
  RECEIVED_FROM_CUSTOMER = 'Received from Customer',
  RECEIVED_FROM_BRANCH = 'Received from Branch',
  WORK_IN_PROGRESS = 'Work in Progress',
  TRANSFERRED = 'Transferred',
  SOLVED = 'Solved - Repairing done',
  TO_REPLACE = 'Unsolved - To Replace',
  UNSOLVED = 'Unsolved - Return to Owner',
  DELIVER_TO_CUSTOMER = 'Deliver to Customer',
}

export class SerialNoHistoryInterface {
  eventDate?: Date;
  eventType?: EventType;
  serial_no?: string;
  document_no?: string;
  transaction_from?: string;
  transaction_to?: string;
  document_type?: string;
  parent_document?: string;
  created_on?: string;
  created_by?: string;
}
