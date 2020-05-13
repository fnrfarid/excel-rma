import {
  MicroserviceHealthIndicator,
  HealthIndicatorFunction,
} from '@nestjs/terminus';
import { Injectable } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { ConfigService, DB_HOST } from '../../../config/config.service';

export const HEALTH_ENDPOINT = '/api/healthz';

@Injectable()
export class HealthCheckAggregateService {
  constructor(
    private readonly microservice: MicroserviceHealthIndicator,
    private readonly config: ConfigService,
  ) {}

  createTerminusOptions(): HealthIndicatorFunction[] {
    const healthEndpoint: HealthIndicatorFunction[] = [
      async () =>
        this.microservice.pingCheck('database', {
          transport: Transport.TCP,
          options: { host: this.config.get(DB_HOST), port: 27017 },
        }),
    ];
    return healthEndpoint;
  }
}
