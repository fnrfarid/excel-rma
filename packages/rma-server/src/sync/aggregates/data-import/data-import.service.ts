import { Injectable, HttpService } from '@nestjs/common';
import {
  DATA_IMPORT_API_ENDPOINT,
  FRAPPE_FILE_ATTACH_API_ENDPOINT,
  FRAPPE_START_DATA_IMPORT_API_ENDPOINT,
} from '../../../constants/routes';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { TokenCache } from '../../../auth/entities/token-cache/token-cache.entity';
import { switchMap, map } from 'rxjs/operators';
import {
  DataImportSuccessResponseInterface,
  FileUploadSuccessResponseInterface,
} from './data-import.interface';
import {
  FRAPPE_DATA_IMPORT_INSERT_ACTION,
  AUTHORIZATION,
  BEARER_HEADER_VALUE_PREFIX,
  ACCEPT,
  APPLICATION_JSON_CONTENT_TYPE,
} from '../../../constants/app-strings';
import { of } from 'rxjs';

@Injectable()
export class DataImportService {
  constructor(private readonly http: HttpService) {}

  addDataImport(
    reference_doctype: string,
    payload: string,
    settings: ServerSettings,
    token: TokenCache,
  ) {
    const response: DataImportSuccessResponse = {};
    const base64Buffer = Buffer.from(payload);
    return this.http
      .post(
        settings.authServerURL + DATA_IMPORT_API_ENDPOINT,
        { reference_doctype, action: FRAPPE_DATA_IMPORT_INSERT_ACTION },
        { headers: this.getAuthorizationHeaders(token) },
      )
      .pipe(
        map(data => data.data.data),
        switchMap((data: DataImportSuccessResponseInterface) => {
          response.dataImportName = data.name;
          return this.http.post(
            settings.authServerURL + FRAPPE_FILE_ATTACH_API_ENDPOINT,
            {
              filename: `data_import.csv`,
              doctype: data.doctype,
              docname: data.name,
              is_private: 1,
              decode_base64: 1,
              filedata: base64Buffer.toString('base64'),
            },
            { headers: this.getAuthorizationHeaders(token) },
          );
        }),
        map(data => data.data.message),
        switchMap((success: FileUploadSuccessResponseInterface) => {
          response.file_name = success.file_name;
          response.file_url = success.file_url;
          return this.http.put(
            settings.authServerURL +
              DATA_IMPORT_API_ENDPOINT +
              `/${success.attached_to_name}`,
            { import_file: success.file_url, submit_after_import: 1 },
            { headers: this.getAuthorizationHeaders(token) },
          );
        }),
        map(data => data.data.data),
        switchMap(submitted_doc => {
          return this.http.post(
            settings.authServerURL + FRAPPE_START_DATA_IMPORT_API_ENDPOINT,
            { data_import: submitted_doc.name },
            { headers: this.getAuthorizationHeaders(token) },
          );
        }),
        switchMap(done => {
          return of(response);
        }),
      );
  }

  getAuthorizationHeaders(token: TokenCache) {
    const headers: any = {};
    headers[AUTHORIZATION] = BEARER_HEADER_VALUE_PREFIX + token.accessToken;
    headers[ACCEPT] = APPLICATION_JSON_CONTENT_TYPE;
    return headers;
  }
}

export class DataImportSuccessResponse {
  dataImportName?: string;
  file_name?: string;
  file_url?: string;
}
