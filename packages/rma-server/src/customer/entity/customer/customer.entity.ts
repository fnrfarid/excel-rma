import {
  Column,
  ObjectIdColumn,
  BaseEntity,
  ObjectID,
  Entity,
  Index,
} from 'typeorm';

export class CustomerCreditLimit {
  credit_limit: number;
  company: string;
}

@Entity()
export class Customer extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  uuid: string;

  @Column()
  @Index({ unique: true })
  name: string;

  @Column()
  company: string;

  @Column()
  owner: string;

  @Column()
  customer_name: string;

  @Column()
  customer_type: string;

  @Column()
  gst_category: string;

  @Column()
  customer_group: string;

  @Column()
  payment_terms: string;

  @Column()
  credit_days: number;

  @Column()
  territory: string;

  @Column()
  credit_limits: CustomerCreditLimit[];

  @Column()
  isSynced: boolean;
}
