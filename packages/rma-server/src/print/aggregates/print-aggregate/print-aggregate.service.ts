import { BadRequestException, Injectable } from '@nestjs/common';
import * as pdfkit from 'pdfkit';
import * as fetch from 'node-fetch';
import { ServerSettingsService } from '../../../system-settings/entities/server-settings/server-settings.service';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { DeliveryChalanDto } from 'src/print/entities/print/print.dto';

@Injectable()
export class PrintAggregateService {
  constructor(private readonly settings: ServerSettingsService) {}

  async getDeliveryChalan(invoice: DeliveryChalanDto, res) {
    let buffer;
    try {
      buffer = await this.appendPDFSections(invoice);
    } catch (error) {
      throw new BadRequestException(error);
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${invoice.name}.pdf`,
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
      this.generateCustomerInformation(doc, invoice);
      this.generatePrintTable(doc, invoice);
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
      .text(invoice.print.print_type, { align: 'center' });
    doc.moveDown();
    const cord = { x: doc.x, y: doc.y };
    doc
      .fontSize(10)
      .text(invoice.name, cord.x, cord.y, { align: 'left' })
      .text(invoice.territory, cord.x, cord.y, { align: 'right' });
    this.generateHr(doc, 155);

    const customerInformationTop = doc.y;

    doc
      .fontSize(10)
      .text('Customer:', 50, customerInformationTop)
      .text(invoice.customer_name, 100, customerInformationTop, { width: 200 })
      .text('Address:', 50, customerInformationTop + 15)
      .text(invoice.address, 100, customerInformationTop)
      .text('Contact:', 50, customerInformationTop + 30)
      .text(invoice.contact, 100, customerInformationTop + 30)
      .text('Mobile No:', 50, customerInformationTop + 45)
      .text(invoice.contact, 100, customerInformationTop + 15)

      .text('Posting Date:', 300, customerInformationTop)
      .text(invoice.posting_date, 420, customerInformationTop)
      .text('Due Date:', 300, customerInformationTop + 15)
      .text(invoice.due_date, 420, customerInformationTop + 15)
      .text('Sold By', 300, customerInformationTop + 30)
      .text(invoice.sold_by, 420, customerInformationTop + 30)
      .text('Created By:', 300, customerInformationTop + 45)
      .text(invoice.created_by, 420, customerInformationTop + 45)
      .text('Approved By:', 300, customerInformationTop + 60)
      .text(invoice.modified_by, 420, customerInformationTop + 60)
      .moveDown()
      .moveDown()
      .moveDown();
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
      const position = doc.y;
      this.generateTableRow(
        doc,
        position,
        i + 1,
        {
          name: item.item_name,
          serials: item.excel_serials ? item.excel_serials : undefined,
        },
        item.qty,
      );
      doc.moveDown();
      this.generateHr(doc, doc.y);
    }

    doc.moveDown();

    this.generateTableRow(doc, doc.y, '', { name: 'Total' }, invoice.total_qty);
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    doc.moveDown();
    const cord = { x: doc.x, y: doc.y };
    doc
      .fontSize(13)
      .text('Received with good condition by', 50, cord.y, { underline: true });
    doc.fontSize(13).text(`For ${invoice.company}`, cord.x, cord.y, {
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
    doc.fontSize(10).text(id, 50, y);
    doc.text(quantity, 450, y, { align: 'right' });
    doc.text(item.serials ? this.getSerialKeys(item) : `${item.name}`, 100, y, {
      width: 390,
    });
  }

  getSerialKeys(item: { name: string; serials?: string }) {
    return `${item.name}
     Serials: ${item.serials?.split('\n').join(' ')}`;
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
}
