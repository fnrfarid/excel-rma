export interface BulkWarrantyClaimInterface {
  company: string;
  supplier: string;
  claims: BulkWarrantyClaim[];
}

export interface BulkWarrantyClaim {
  serial_no: string;
  item_code: string;
  company: string;
  supplier: string;
  itemWarrantyDate: string;
}
