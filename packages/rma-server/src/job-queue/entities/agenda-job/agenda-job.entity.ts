import { Column, ObjectIdColumn, ObjectID, Entity } from 'typeorm';
import { ServerSettings } from '../../../system-settings/entities/server-settings/server-settings.entity';
import { TokenCache } from '../../../auth/entities/token-cache/token-cache.entity';
import { DataImportSuccessResponse } from '../../../sync/service/data-import/data-import.service';

export class JobData {
  payload: any;
  settings: ServerSettings;
  type: string;
  parent: string;
  token: TokenCache;
  status: string;
}

@Entity({ name: 'agendaJobs' })
export class AgendaJob {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  data: JobData;

  @Column()
  failedAt: any;

  @Column()
  failCount: any;

  @Column()
  failReason: any;

  @Column()
  lastModifiedBy: Date;

  @Column()
  nextRunAt: Date;

  @Column()
  priority: number;

  @Column()
  repeatInterval: string;

  @Column()
  dataImport?: DataImportSuccessResponse;

  @Column()
  repeatTimezone: string;

  @Column()
  lockedAt: Date;

  @Column()
  lastRunAt: Date;

  @Column()
  lastFinishedAt: Date;
}
