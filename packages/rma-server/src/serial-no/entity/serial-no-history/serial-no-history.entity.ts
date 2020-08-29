import { Column, ObjectIdColumn, BaseEntity, ObjectID, Entity, Index } from 'typeorm';

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
}
