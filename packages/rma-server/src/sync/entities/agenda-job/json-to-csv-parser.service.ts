import { Injectable } from '@nestjs/common';
import {
  DELIVERY_NOTE_CSV_TEMPLATE_HEADERS,
  DELIVERY_NOTE_CSV_TEMPLATE,
} from '../../assets/data_import_template';

@Injectable()
export class JsonToCsvParserService {
  mapJsonToCsv(data: any) {
    let row = '';
    DELIVERY_NOTE_CSV_TEMPLATE_HEADERS.forEach((key: any) => {
      if (data[key]) {
        row = row + `${data[key]},`;
      } else if (typeof key === 'object') {
        const value = data[key[0]][key[1]][key[2]];
        row = row + `"${value ? value : ''}",`;
      } else {
        row = row + ',';
      }
    });
    return DELIVERY_NOTE_CSV_TEMPLATE + row;
  }
}
