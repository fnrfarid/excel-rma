import { Injectable } from '@nestjs/common';

@Injectable()
export class JsonToCSVParserService {
  mapJsonToCsv(data: any, headers: any[], template: string) {
    let row = '';
    headers.forEach((key: any) => {
      if (data[key] !== undefined) {
        row = row + `"${data[key]}",`;
      } else if (typeof key === 'object') {
        let value = data[key[0]][key[1]][key[2]];
        if (key[2] === 'serial_no' && !data[key[0]][key[1]].has_serial_no) {
          value = undefined;
        }
        row = row + `"${value !== undefined ? value : ''}",`;
      } else {
        row = row + ',';
      }
    });
    if (row.endsWith(',')) {
      row = row.slice(0, -1);
    }
    return template + row;
  }
}
