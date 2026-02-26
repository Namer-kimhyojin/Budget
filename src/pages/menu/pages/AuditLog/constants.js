export const STATUS_KO = {
  DRAFT: '작성중',
  PENDING: '제출',
  REVIEWING: '검토중',
  FINALIZED: '확정',
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  ACTION: '행위',
  LOGIN: '로그인',
  LOGIN_FAILED: '로그인 실패',
  LOGOUT: '로그아웃',
  SIGNUP: '회원가입',
  AUTH: '인증',
  API: 'API',
};

export const STATUS_COLOR = {
  DRAFT: { color: '#9a3412', bg: '#ffedd5' },
  PENDING: { color: '#1d4ed8', bg: '#dbeafe' },
  REVIEWING: { color: '#5b21b6', bg: '#ede9fe' },
  FINALIZED: { color: '#065f46', bg: '#d1fae5' },
  CREATE: { color: '#166534', bg: '#dcfce7' },
  UPDATE: { color: '#1d4ed8', bg: '#dbeafe' },
  DELETE: { color: '#b91c1c', bg: '#fee2e2' },
  ACTION: { color: '#334155', bg: '#e2e8f0' },
  LOGIN: { color: '#0f766e', bg: '#ccfbf1' },
  LOGIN_FAILED: { color: '#991b1b', bg: '#fecaca' },
  LOGOUT: { color: '#0f766e', bg: '#ccfbf1' },
  SIGNUP: { color: '#7c3aed', bg: '#ede9fe' },
  AUTH: { color: '#475569', bg: '#e2e8f0' },
  API: { color: '#475569', bg: '#e2e8f0' },
};

export const LEVEL_STYLE = {
  danger: { bg: '#fef2f2', border: '#fca5a5', badge: '#dc2626', icon: '!!' },
  warning: { bg: '#fffbeb', border: '#fcd34d', badge: '#d97706', icon: '!' },
  info: { bg: '#eff6ff', border: '#93c5fd', badge: '#2563eb', icon: 'i' },
};
