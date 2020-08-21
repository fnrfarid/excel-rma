import { ICommand } from '@nestjs/cqrs';
import { UpdateServiceInvoiceDto } from '../../entity/service-invoice/update-service-invoice-dto';

export class SubmitServiceInvoiceCommand implements ICommand {
  constructor(
    public readonly updatePayload: UpdateServiceInvoiceDto,
    public readonly req: any,
  ) {}
}
