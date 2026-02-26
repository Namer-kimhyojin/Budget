import { formatDate, toDateOnly, dayDiff } from '../shared';

export const formatLogDateTime = (value) => {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString('ko-KR', { hour12: false });
};

export const isRejectLog = (log) => (
  log?.to_status === 'DRAFT' && String(log?.reason || '').trim()
);

export const versionRelatedInfo = (targetVersion) => {
  const start = toDateOnly(targetVersion?.start_date);
  const end = toDateOnly(targetVersion?.end_date);
  const today = toDateOnly(new Date());
  const periodText = `${formatDate(start)} ~ ${formatDate(end)}`;
  if (!start && !end) return { periodText: '미지정', deadlineText: '입력기간 미지정' };
  if (!today) return { periodText, deadlineText: '-' };
  if (start && today < start) return { periodText, deadlineText: `시작 전 D-${dayDiff(start, today)}` };
  if (end && today > end) return { periodText, deadlineText: `마감 +${dayDiff(today, end)}일` };
  if (end && dayDiff(end, today) === 0) return { periodText, deadlineText: '오늘 마감 (D-Day)' };
  if (end) return { periodText, deadlineText: `마감 D-${dayDiff(end, today)}` };
  return { periodText, deadlineText: '진행중' };
};
