import {
  TerminusEndpoint,
  TerminusOptionsFactory,
  TerminusModuleOptions,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { ConfigService, DB_HOST } from '../../../config/config.service';

@Injectable()
export class TerminusOptionsService implements TerminusOptionsFactory {
  constructor(
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly config: ConfigService,
  ) {}

  createTerminusOptions(): TerminusModuleOptions {
    const healthEndpoint: TerminusEndpoint = {
      url: '/api/healthz',
      healthIndicators: [
        async () =>
          this.microservice.pingCheck('database', {
            transport: Transport.TCP,
            options: { host: this.config.get(DB_HOST), port: 27017 },
          }),
      ],
    };
    return {
      endpoints: [healthEndpoint],
    };
  }
}
