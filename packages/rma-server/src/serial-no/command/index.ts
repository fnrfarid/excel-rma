import { AddSerialNoHandler } from './add-serial-no/add-serial-no-command.handler';
import { RemoveSerialNoHandler } from './remove-serial-no/remove-serial-no-command.handler';
import { UpdateSerialNoHandler } from './update-serial-no/update-serial-no-command.handler';

export const SerialNoCommandManager = [
  AddSerialNoHandler,
  RemoveSerialNoHandler,
  UpdateSerialNoHandler,
];
