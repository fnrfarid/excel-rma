export class DataImportSuccessResponseInterface {
  name: string;
  reference_doctype: string;
  import_type: string;
  doctype: string;
  status: string;
  insert_new: number;
  import_log: string;
}

export class FileUploadSuccessResponseInterface {
  file_name: string;
  is_private: number;
  file_url: string;
  folder: string;
  attached_to_doctype: string;
  attached_to_name: string;
  doctype: string;
}
