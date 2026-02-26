export const STATUS_LABELS = {
  DRAFT: '작성중',
  PENDING: '매니저 검토중',
  REVIEWING: '총무팀 검토중',
  FINALIZED: '확정',
  MIXED: '혼합상태',
};

export const REASON_TAGS = {
  EDIT: '[수정]',
  RECALL: '[회수]',
  REJECT: '[반려]',
};

export const normalizeReason = (value) => String(value || '').trim();

export const isTaggedReason = (reason, tag) => normalizeReason(reason).startsWith(tag);

export const isRecallLog = (log) => isTaggedReason(log?.reason, REASON_TAGS.RECALL);

export const isEditLog = (log) => isTaggedReason(log?.reason, REASON_TAGS.EDIT);

export const isRejectLog = (log) => {
  const reason = normalizeReason(log?.reason);
  if (!reason) return false;
  if ((log?.to_status || '') !== 'DRAFT') return false;
  if (isRecallLog(log) || isEditLog(log)) return false;
  return ['PENDING', 'REVIEWING'].includes(log?.from_status || '');
};

export const safeFileName = (value) => String(value || 'department')
  .replace(/[\\/:*?"<>|]/g, '_')
  .replace(/\s+/g, '_');

export const toLogMarker = (log) => {
  if (!log) return '';
  return String(
    log.id
    || `${log.created_at || ''}:${log.from_status || ''}:${log.to_status || ''}:${log.reason || ''}`
  );
};

export const formatLogDateTime = (value) => {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString('ko-KR', { hour12: false });
};
