import { Module } from '@nestjs/common';
import { ErrorLogController } from './controller/error-logs.controller';
import { ErrorLogService } from './error-log-service/error-log.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorLog } from './error-log-service/error-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorLog])],
  controllers: [ErrorLogController],
  providers: [ErrorLogService],
  exports: [ErrorLogService],
})
export class ErrorLogModule {}
