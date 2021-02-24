import { BadRequestException, Injectable } from '@nestjs/common';
import * as pdfkit from 'pdfkit';
import * as fetch from 'node-fetch';
import { ServerSettingsService } from '../../../system-settings/entities/server-settings/server-settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { DeliveryChalanDto } from '../../../print/entities/print/print.dto';
import { Response } from 'express';
import { WarrantyClaimDto } from '../../../warranty-claim/entity/warranty-claim/warranty-claim-dto';
import { CLAIM_STATUS } from '../../../constants/app-strings';

@Injectable()
export class PrintAggregateService {
  constructor(private readonly settings: ServerSettingsService) {}

  async getDeliveryChalan(invoice: DeliveryChalanDto, res: Response) {
    let buffer;
    try {
      buffer = await this.appendPDFSections(invoice);
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

  async appendPDFSections(invoice): Promise<Buffer> {
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
      if (invoice.claim_no) {
        this.generateWarrantyCustomerInformation(doc, invoice);
        this.generateWarrantyPrintTable(doc, invoice);
      } else {
        this.generateCustomerInformation(doc, invoice);
        this.generatePrintTable(doc, invoice);
      }
      await this.generateFooter(doc, serverSettings);
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
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text(invoice.print?.print_type || 'Delivery Chalan', {
        align: 'center',
      });
    doc.moveDown();
    const cord = { x: doc.x, y: doc.y };
    doc
      .fontSize(10)
      .text(invoice.name, cord.x, cord.y, { align: 'left' })
      .text(invoice.territory, cord.x, cord.y, { align: 'right' });
    doc.moveDown();
    this.generateHr(doc, doc.y);

    const customerInformationTop = doc.y;

    doc
      .fontSize(10)
      .text('Customer:', 50, customerInformationTop)
      .text(invoice.customer_name, 100, customerInformationTop, { width: 200 })
      .text('Address:', 50, customerInformationTop + 15)
      .text(invoice.address, 100, customerInformationTop + 15)
      .text('Contact:', 50, customerInformationTop + 30)
      .text(invoice.contact, 100, customerInformationTop + 30)
      .text('Mobile No:', 50, customerInformationTop + 45)
      .text(invoice.contact, 100, customerInformationTop + 45)

      .text('Posting Date:', 300, customerInformationTop)
      .text(invoice.posting_date, 420, customerInformationTop)
      .text('Due Date:', 300, customerInformationTop + 15)
      .text(invoice.due_date, 420, customerInformationTop + 15)
      .text('Sold By', 300, customerInformationTop + 30)
      .text(invoice.sold_by, 420, customerInformationTop + 30)
      .text('Created By:', 300, customerInformationTop + 45)
      .text(invoice.created_by, 420, customerInformationTop + 45)
      .text('Approved By:', 300, customerInformationTop + 60)
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

  async generateFooter(doc, settings: ServerSettings) {
    doc.moveDown();
    const image = await this.getCDNImage(settings.footerImageURL);
    doc.image(image, 30, doc.y, { width: settings.footerWidth });
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

  generateWarrantyCustomerInformation(doc, invoice: WarrantyClaimDto) {
    // this function is not updated if your working don't make changes unless your trying to make it dynamic.
    // this customer section will be dynamic from a object instead of hardcoded.
    doc.moveDown();
    doc.moveDown();
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text(invoice.print?.print_type || 'Delivery Chalan', {
        align: 'center',
      });
    doc.moveDown();
    const cord = { x: doc.x, y: doc.y };
    doc
      .fontSize(10)
      .text(invoice.claim_no, cord.x, cord.y, { align: 'left' })
      .text(invoice.receiving_branch, cord.x, cord.y, { align: 'right' });
    doc.moveDown();
    this.generateHr(doc, doc.y);

    const customerInformationTop = doc.y;
    let yAxis = 0;
    // let xAxis = 50
    const customerInfoObject = {
      'Third Party Name': invoice.third_party_name,
      'Third Party Contact': invoice.third_party_contact,
      'Third Party Address': invoice.third_party_address,
      'Contact Name:': invoice.customer,
      'Contact No:': invoice.customer_contact,
      'Remarks:': invoice.remarks,
      'Contact Address:': invoice.customer_address,
      'Claim No:': invoice.claim_no,
      'Claim Date:': invoice.received_on,
      'Delivery Date:': invoice.delivery_date,
      'Claim Branch:': invoice.receiving_branch,
    };

    for (const key in customerInfoObject) {
      if (Object.prototype.hasOwnProperty.call(customerInfoObject, key)) {
        if (
          Object.keys(customerInfoObject).indexOf(key) >=
          Object.keys(customerInfoObject).length / 2
        ) {
          if (
            Math.round(Object.keys(customerInfoObject).length / 2) ===
            Object.keys(customerInfoObject).indexOf(key)
          )
            yAxis = 0;
          doc.fontSize(10).text(key, 300, customerInformationTop + yAxis);
          doc
            .fontSize(10)
            .text(customerInfoObject[key], 420, customerInformationTop + yAxis);
        } else {
          doc.fontSize(10).text(key, 50, customerInformationTop + yAxis);
          doc
            .fontSize(10)
            .text(customerInfoObject[key], 150, customerInformationTop + yAxis);
        }
        yAxis += 15;
      }
    }

    switch (invoice.claim_status) {
      case CLAIM_STATUS.DELIVERED:
        doc
          .fontSize(10)
          .text('Delivered By:', 300, customerInformationTop + yAxis)
          .text(invoice.delivered_by, 420, customerInformationTop + yAxis);
        break;
      default:
        doc
          .fontSize(10)
          .text('Received By:', 300, customerInformationTop + yAxis)
          .text(invoice.received_by, 420, customerInformationTop + yAxis);
        break;
    }

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

  addRow(
    doc,
    invoice: {
      item_name?: string;
      serial_no?: string;
      warranty_end_date?: Date;
      delivery_status?: string;
    },
  ) {
    this.generateHr(doc, doc.y + 10);
    doc.font('Helvetica');
    this.generateWarrantyTableRow(doc, doc.y, invoice.delivery_status, {
      name: invoice.item_name,
      serials: invoice.serial_no ? invoice.serial_no : undefined,
      warranty_end_date: invoice.warranty_end_date,
    });
    this.checkPagePagination(doc);
    doc.moveDown();
    this.generateHr(doc, doc.y);
    doc.moveDown();
  }

  generateWarrantyPrintTable(doc, invoice: WarrantyClaimDto) {
    const invoiceTableTop = doc.y + 10;

    doc.font('Helvetica-Bold');
    switch (invoice.claim_status) {
      case CLAIM_STATUS.DELIVERED:
        this.generateWarrantyTableRow(doc, invoiceTableTop, 'Status', {
          name: 'Claimed Product',
        });
        this.addRow(doc, {
          item_name: invoice.item_name,
          serial_no: invoice.serial_no,
          warranty_end_date: invoice.warranty_end_date,
          delivery_status: invoice.status_history.splice(-1)[0].delivery_status,
        });
        this.generateWarrantyTableRow(doc, invoiceTableTop, '', {
          name: 'Replaced Product',
        });
        this.addRow(doc, {
          item_name: invoice.replace_product,
          serial_no: invoice.replace_serial,
          warranty_end_date: invoice.warranty_end_date,
          delivery_status: invoice.status_history.splice(-1)[0].delivery_status,
        });
        break;

      default:
        this.generateWarrantyTableRow(doc, invoiceTableTop, 'Status', {
          name: 'Claimed Product',
        });
        this.addRow(doc, {
          item_name: invoice.item_name,
          serial_no: invoice.serial_no,
          warranty_end_date: invoice.warranty_end_date,
          delivery_status: invoice.status_history.splice(-1)[0].delivery_status,
        });
        break;
    }

    this.generateTableRow(doc, doc.y, '', { name: '' }, '');
    doc.moveDown();
    doc.moveDown();
    this.checkPagePagination(doc);

    if (invoice.billed_amount !== undefined) {
      const printObject = {
        'Voucher Number': invoice.service_vouchers.toString(),
        'Product Description': invoice.service_items.toString(),
        Total: invoice.billed_amount,
        'Paid Amount': invoice.billed_amount,
        'Unpaid Amount': 0,
      };
      let height = doc.y;
      // let xAxis = 50
      for (const key in printObject) {
        if (Object.prototype.hasOwnProperty.call(printObject, key)) {
          doc.font('Helvetica-Bold');
          doc.text(
            key,
            100 * Object.keys(printObject).indexOf(key) + 50,
            height,
            { width: 100 },
          );
        }
      }
      doc.moveDown();
      height = doc.y;
      for (const key in printObject) {
        if (Object.prototype.hasOwnProperty.call(printObject, key)) {
          doc.font('Helvetica');
          doc.text(
            printObject[key],
            100 * Object.keys(printObject).indexOf(key) + 50,
            height,
            { width: 90 },
            { align: 'center' },
          );
        }
      }
    }
    if (invoice.service_vouchers) {
      invoice.service_vouchers.forEach(voucher => {
        doc.moveDown();
      });
    }
    doc.moveDown();
    doc.fontSize(10).text(`Terms:`, 50, doc.y);
    doc
      .fontSize(9)
      .text(
        `- Temporarily received for checking. Decision for warranty claim can be obtained on the next 3 working days.`,
        50,
        doc.y,
      );
    doc
      .fontSize(9)
      .text(
        `- The RMA department will thoroughly inspect the product and will support as per company warranty policy.`,
        50,
        doc.y,
      );
    doc.fontSize(9).text(
      `- The warranty is not applicable for power supply, adapter, remote-control, 
    sticker removed items, burnt and physically damaged items, products
    with tampered & missing serial numbers.`,
      50,
      doc.y,
    );
    doc.fontSize(9).text(
      `- If any goods are not taken back within 30 days,
    ETL authority will not be responsible for any damage or loss of the goods.`,
      50,
      doc.y,
    );
    doc
      .fontSize(9)
      .text(
        `- For any Information, please call Hotline: +88 09606 - 999645`,
        50,
        doc.y,
      );

    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    const cord = { x: doc.x, y: doc.y };
    doc
      .fontSize(13)
      .text('Received with good condition by', 50, cord.y, { underline: true });
    doc.fontSize(13).text(`For ${invoice.company} `, 250, cord.y, {
      underline: true,
      align: 'right',
    });
  }

  generateWarrantyTableRow(
    doc,
    y,
    status,
    item: { name: string; serials?: string; warranty_end_date?: Date },
  ) {
    doc.moveDown();
    const height = doc.y;
    doc.fontSize(10).fillColor('#000000').text('', 20, height);
    if (status) {
      doc
        .text(item.name, 50, height, { width: 400 })
        .text(status, 450, height, { align: 'right' });
    }
    doc
      .text(item.name, 50, height, { width: 400 })
      .text('-', 450, height, { align: 'right' });

    if (item.serials) {
      doc
        .fillColor('#444444')
        .text(this.getSerialKeys(item), 50, doc.y, { width: 400 });
    }
    if (item.warranty_end_date) {
      doc
        .fillColor('#444444')
        .text(
          this.getWarrantyDate(item.warranty_end_date.toString()),
          50,
          doc.y,
          { width: 400 },
        );
    }
  }

  getWarrantyDate(warranty_date: string) {
    return `Warranty End Date: ${warranty_date} `;
  }
}
