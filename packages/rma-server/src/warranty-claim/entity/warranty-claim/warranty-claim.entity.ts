import { Column, ObjectIdColumn, BaseEntity, ObjectID, Entity } from 'typeorm';

@Entity()
export class WarrantyClaim extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  uuid: string;

  @Column()
  company: string;

  @Column()
  createdOn: Date;

  @Column()
  itemWarrantyDate: string;

  @Column()
  modifiedOn: Date;

  @Column()
  supplier: string;

  @Column()
  status: string;

  @Column()
  deliveryNoteUuid: string;

  @Column()
  salesReturnUuid: string;

  @Column()
  salesInvoiceUuid: string;

  @Column()
  serialNo: string;

  @Column()
  item_code: string;
}
