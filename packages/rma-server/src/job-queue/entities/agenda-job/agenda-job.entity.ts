import { Column, ObjectIdColumn, ObjectID, Entity } from 'typeorm';

@Entity({ name: 'agendaJobs' })
export class AgendaJob {
  @ObjectIdColumn()
  _id: ObjectID;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  data: any;

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
  repeatTimezone: string;

  @Column()
  lockedAt: Date;

  @Column()
  lastRunAt: Date;

  @Column()
  lastFinishedAt: Date;
}
