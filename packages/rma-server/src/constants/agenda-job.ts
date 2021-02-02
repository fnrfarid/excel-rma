export const AGENDA_JOB_METADATA = {
  name: '',
  type: 'single',
  data: null,
  lastModifiedBy: null,
  nextRunAt: new Date(),
  token: null,
  priority: 0,
  inQueue: false,
  repeatInterval: null,
  repeatTimezone: null,
  lockedAt: null,
  lastRunAt: new Date(),
  lastFinishedAt: new Date(),
};

export function getParsedPostingDate(payload) {
  let date: Date;
  try {
    date = new Date(
      `${payload.posting_date} ${payload.posting_time || '00:00:00'}`,
    );
  } catch {}
  if (date && isNaN(date?.getMilliseconds())) {
    date = new Date();
  }
  return date;
}
