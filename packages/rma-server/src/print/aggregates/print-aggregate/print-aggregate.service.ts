import {
  BadRequestException,
  HttpService,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import * as pdfkit from 'pdfkit';
import * as fetch from 'node-fetch';
import { ServerSettingsService } from '../../../system-settings/entities/server-settings/server-settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import {
  DeliveryChalanDto,
  WarrantyPrintDetails,
  WarrantyPrintItems,
  WarrantyVouchers,
} from '../../../print/entities/print/print.dto';
import { Response } from 'express';
import { WarrantyClaimDto } from '../../../warranty-claim/entity/warranty-claim/warranty-claim-dto';
import {
  APPLICATION_JSON_CONTENT_TYPE,
  CATEGORY,
} from '../../../constants/app-strings';
import { ServiceInvoiceService } from '../../../service-invoice/entity/service-invoice/service-invoice.service';
import { from, of, throwError } from 'rxjs';
import { catchError, concatMap, map, switchMap, toArray } from 'rxjs/operators';
import { POST_WARRANTY_PRINT_ENDPOINT } from '../../../constants/routes';
import { SettingsService } from '../../../system-settings/aggregates/settings/settings.service';

@Injectable()
export class PrintAggregateService {
  constructor(
    private readonly settings: ServerSettingsService,
    private invoiceService: ServiceInvoiceService,
    private http: HttpService,
    private settingService: SettingsService,
  ) {}

  async getDeliveryChalan(invoice: DeliveryChalanDto, res: Response, req) {
    let buffer;
    try {
      buffer = await this.appendPDFSections(invoice, req);
    } catch (error) {
      throw new BadRequestException(error);
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${invoice.print.print_type}.pdf`,
      'Content-Length': buffer.length,
    });

    return res.end(buffer);
  }

  async appendPDFSections(invoice, req): Promise<Buffer> {
    const pdfBuffer: Buffer = await new Promise(async resolve => {
      const doc = new pdfkit({
        size: 'A4',
        margin: 50,
        bufferPages: true,
      });
      doc.info.Title = invoice.name;
      const buffer = [];
      doc.on('data', buffer.push.bind(buffer));
      doc.on('end', () => {
        const data = Buffer.concat(buffer);
        resolve(data);
      });

      const serverSettings = await this.settings.find();
      await this.generateHeader(doc, serverSettings);
      this.generateCustomerInformation(doc, invoice);
      this.generatePrintTable(doc, invoice);
      await this.generateFooter(
        doc,
        serverSettings,
        'https://www.excelbd.com/wp-content/uploads/2021/02/Warranty-Claim-Footer.jpg',
      );
      doc.end();
    });

    return pdfBuffer;
  }

  async generateHeader(doc, settings: ServerSettings) {
    const image = await this.getCDNImage(settings.headerImageURL);
    doc.image(image, 50, 45, { width: settings.headerWidth }).moveDown();
  }

  async getCDNImage(url) {
    const response = await fetch(url);
    return await response.arrayBuffer();
  }

  generateCustomerInformation(doc, invoice: DeliveryChalanDto) {
    // this function is not updated if your working don't make changes unless your trying to make it dynamic.
    // this customer section will be dynamic from a object instead of hardcoded.
    doc.moveDown();
    doc.moveDown();

    const cord = { x: doc.x, y: doc.y };
    doc
      .fontSize(10)
      .text(invoice.name, cord.x, cord.y, { align: 'left' })
      .text(invoice.print?.print_type || 'Delivery Chalan', cord.x, cord.y, {
        align: 'center',
      })
      .text(invoice.territory, cord.x, cord.y, { align: 'right' });
    doc.moveDown();
    this.generateHr(doc, doc.y);

    const customerInformationTop = doc.y;

    doc
      .fontSize(10)
      .text('Customer:', 50, customerInformationTop)
      .text(invoice.customer_name, 100, customerInformationTop, { width: 200 })
      .text('Address:', 50, customerInformationTop + 15)
      .text(invoice.address_display, 100, customerInformationTop + 15)
      .text('Mobile No:', 50, customerInformationTop + 45)
      .text(invoice.contact_mobile, 100, customerInformationTop + 45)

      .text('Posting Date:', 300, customerInformationTop)
      .text(invoice.posting_date, 420, customerInformationTop)
      .text('Sold By', 300, customerInformationTop + 30)
      .text(invoice.sales_person, 420, customerInformationTop + 30)
      .text('Created By:', 300, customerInformationTop + 45)
      .text(invoice.created_by, 420, customerInformationTop + 45)
      .text('Delivered By:', 300, customerInformationTop + 60)
      .text(invoice.modified_by, 420, customerInformationTop + 60);

    if (invoice?.print?.s_warehouse || invoice?.print?.t_warehouse) {
      if (invoice?.print?.s_warehouse) {
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(
            `From Warehouse: ${invoice.print.s_warehouse}`,
            50,
            customerInformationTop + 95,
          );
      }

      if (invoice?.print?.t_warehouse) {
        doc
          .fontSize(11)
          .fillColor('#000000')
          .text(
            `To Warehouse: ${invoice.print.t_warehouse}`,
            300,
            customerInformationTop + 95,
            { align: 'right' },
          );
      }
    }

    doc.moveDown().moveDown();
  }

  generatePrintTable(doc, invoice: DeliveryChalanDto) {
    let i;
    const invoiceTableTop = doc.y + 10;

    doc.font('Helvetica-Bold');
    this.generateTableRow(
      doc,
      invoiceTableTop,
      'SI.',
      { name: 'Item Name' },
      'Qty',
    );
    doc.moveDown();
    this.generateHr(doc, invoiceTableTop + 20);
    doc.font('Helvetica');

    for (i = 0; i < invoice.items.length; i++) {
      const item = invoice.items[i];
      this.generateTableRow(
        doc,
        doc.y,
        i + 1,
        {
          name: item.item_name,
          serials: item.excel_serials ? item.excel_serials : undefined,
        },
        item.qty,
      );
      this.checkPagePagination(doc);
      doc.moveDown();
      this.generateHr(doc, doc.y);
    }
    doc.moveDown();

    this.generateTableRow(
      doc,
      doc.y,
      '',
      { name: 'Total' },
      invoice.total_qty || this.getItemTotal(invoice.items),
    );

    this.generateTableRow(
      doc,
      doc.y,
      '',
      {
        name: 'Remarks',
      },
      '',
    );
    this.generateTableRow(
      doc,
      doc.y,
      '',
      {
        name: invoice.remarks,
      },
      '',
    );

    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    this.checkPagePagination(doc);

    const cord = { x: doc.x, y: doc.y };
    doc
      .fontSize(13)
      .text('Received with good condition by', 50, cord.y, { underline: true });
    doc.fontSize(13).text(`For ${invoice.company}`, 250, cord.y, {
      underline: true,
      align: 'right',
    });
  }

  async generateFooter(doc, settings: ServerSettings, imageUrl?: string) {
    doc.moveDown();
    const image = !imageUrl
      ? await this.getCDNImage(settings.footerImageURL)
      : await this.getCDNImage(imageUrl);
    doc.image(image, 20, doc.page.height - 50, {
      lineBreak: false,
      width: settings.footerWidth,
    });
    // replaced above line with below for footer needed at bottom of page incase if it breaks in sales changed it.
    // doc.image(image, 30, doc.y, { width: settings.footerWidth });
  }

  generateTableRow(
    doc,
    y,
    id,
    item: { name: string; serials?: string },
    quantity,
  ) {
    doc.moveDown();
    const height = doc.y;
    doc.fontSize(10).fillColor('#000000').text(id, 50, height);
    doc.text(item.name, 100, height, { width: 390 });
    doc.text(quantity, 450, height, { align: 'right' });
    if (item.serials) {
      doc
        .fillColor('#444444')
        .text(this.getSerialKeys(item), 100, doc.y, { width: 390 });
    }
  }

  getItemTotal(items: any[]) {
    let total = 0;
    items.forEach(item => (total += item.qty));
    return total;
  }

  getSerialKeys(item: { name: string; serials?: string }) {
    return `Serials: ${item.serials?.split('\n').join(' ')}`;
  }

  checkPagePagination(doc) {
    if (doc.y > 680) {
      doc.addPage();
    }
  }

  generateHr(doc, y) {
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke()
      .moveDown();
  }

  formatCurrency(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  formatDate(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return year + '/' + month + '/' + day;
  }

  createFrappePrint(req, invoice: WarrantyClaimDto) {
    return this.generateWarrantyPrintBody(req, invoice);
  }

  generateWarrantyPrintBody(req, invoice: WarrantyClaimDto) {
    const erpBody = {} as WarrantyPrintDetails;
    invoice.service_vouchers = invoice.service_vouchers
      ? invoice.service_vouchers
      : [];
    Object.assign(erpBody, invoice);
    erpBody.name = invoice.uuid;
    erpBody.delivery_status = invoice.claim_status;
    erpBody.print_type = invoice.print.print_type;
    erpBody.items = JSON.stringify(this.mapWarrantyItems(invoice));
    return from(
      this.invoiceService.find({
        invoice_no: { $in: invoice.service_vouchers },
      }),
    ).pipe(
      switchMap(res => {
        return from(res).pipe(
          concatMap(singleVoucher => {
            return of({
              voucher_number: singleVoucher.invoice_no,
              description: singleVoucher.items[0].item_name,
              amount: singleVoucher.total,
              paid: singleVoucher.total,
              unpaid: singleVoucher.total - singleVoucher.total,
            });
          }),
          toArray(),
        );
      }),
      switchMap((warrantyInvoices: WarrantyVouchers[]) => {
        Object.values([
          'progress_state',
          'completed_delivery_note',
          'set',
          'damaged_serial',
          'damage_warehouse',
          'damage_product',
          'category',
          'service_items',
          'service_vouchers',
          'bulk_products',
          'status_history',
          'print',
        ]).forEach(key => {
          delete erpBody[key];
        });
        erpBody.warranty_invoices = JSON.stringify([...warrantyInvoices]);
        return of(erpBody);
      }),
      switchMap((body: WarrantyPrintDetails) => {
        return this.createWarrantyPrintDocument(req, body);
      }),
    );
  }

  createWarrantyPrintDocument(req, warrantyPrintBody: WarrantyPrintDetails) {
    let url: string = '';
    return this.settingService.find().pipe(
      switchMap(setting => {
        if (!setting.authServerURL) {
          return throwError(new NotImplementedException());
        }
        url = `${setting.authServerURL}${POST_WARRANTY_PRINT_ENDPOINT}`;
        return this.http.get(`${url}/${warrantyPrintBody.uuid}`, {
          headers: {
            authorization: req.headers.authorization,
            Accept: APPLICATION_JSON_CONTENT_TYPE,
          },
        });
      }),
      map(res => res.data),
      switchMap(() => {
        return this.http.put(
          `${url}/${warrantyPrintBody.uuid}`,
          warrantyPrintBody,
          {
            headers: {
              authorization: req.headers.authorization,
              Accept: APPLICATION_JSON_CONTENT_TYPE,
            },
          },
        );
      }),
      map(res => res.data),
      catchError(err => {
        if (err.response.status === 404) {
          return this.http.post(url, warrantyPrintBody, {
            headers: {
              authorization: req.headers.authorization,
              Accept: APPLICATION_JSON_CONTENT_TYPE,
            },
          });
        }
        return throwError(new BadRequestException(err.response.statusText));
      }),
      map(res => res.data),
    );
  }

  mapWarrantyItems(invoice: WarrantyClaimDto) {
    const array: WarrantyPrintItems[] = [];
    if (invoice.set === CATEGORY.BULK) {
      return [...invoice.bulk_products];
    }
    return [
      ...array,
      {
        item_name: invoice.item_name,
        serial_no: invoice.serial_no,
        warranty_end_date: invoice.warranty_end_date,
      },
    ];
  }
}
