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

  @Column()
  customer: string;

  @Column()
  customer_contact: string;

  @Column()
  customer_address: string;

  @Column()
  serial_no: string;

  @Column()
  third_party_name: string;

  @Column()
  third_party_contact: string;

  @Column()
  third_party_address: string;

  @Column()
  warranty_claim_date: Date;

  @Column()
  warranty_end_date: Date;

  @Column()
  received_on: string;

  @Column()
  delivery_date: Date;

  @Column()
  item_name: string;

  @Column()
  product_brand: string;

  @Column()
  problem: string;

  @Column()
  problem_details: string;

  @Column()
  remarks: string;

  @Column()
  status_history: StatusHistory[];
}

export class StatusHistory {
  posting_date: Date;
  time: Date;
  status_from: string;
  transfer_branch: string;
  verdict: string;
  description: string;
  delivery_status: string;
  status: string;
}
