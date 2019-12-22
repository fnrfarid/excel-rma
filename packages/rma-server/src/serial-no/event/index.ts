import { SerialNoAddedHandler } from './serial-no-added/serial-no-added-event.handler';
import { SerialNoRemovedHandler } from './serial-no-removed/serial-no.removed-event.handler';
import { SerialNoUpdatedHandler } from './serial-no-updated/serial-no-updated-event.handler';

export const SerialNoEventManager = [
  SerialNoAddedHandler,
  SerialNoRemovedHandler,
  SerialNoUpdatedHandler,
];
