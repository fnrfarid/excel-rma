import { Column, ObjectIdColumn, BaseEntity, ObjectID, Entity } from 'typeorm';

@Entity()
export class Item extends BaseEntity {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  uuid: string;

  @Column()
  creation: string;

  @Column()
  modified: string;

  @Column()
  name: string;

  @Column()
  owner: string;

  @Column()
  modified_by: string;

  @Column()
  docstatus: number;

  @Column()
  item_code: string;

  @Column()
  item_name: string;

  @Column()
  item_group: string;

  @Column()
  stock_uom: string;

  @Column()
  disabled: number;

  @Column()
  description: string;

  @Column()
  shelf_life_in_days: number;

  @Column()
  end_of_life: string;

  @Column()
  default_material_request_type: string;

  @Column()
  has_serial_no: number;

  @Column()
  has_variants: number;

  @Column()
  is_purchase_item: number;

  @Column()
  min_order_qty: number;

  @Column()
  safety_stock: number;

  @Column()
  last_purchase_rate: number;

  @Column()
  country_of_origin: string;

  @Column()
  is_sales_item: number;

  @Column()
  isSynced: boolean;
}
