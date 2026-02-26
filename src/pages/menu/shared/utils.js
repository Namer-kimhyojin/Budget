export const num = (v) => (Number(v) || 0).toLocaleString();
export const toList = (d) => (Array.isArray(d) ? d : d?.results || []);

export const apiErrorMessage = (e, fallback = '오류가 발생했습니다.') => {
  const data = e?.response?.data;
  if (!data) {
    const status = e?.response?.status;
    const msg = e?.message || '네트워크 오류';
    return status ? `${fallback} (상태코드 ${status})` : `${fallback} (${msg})`;
  }
  if (typeof data === 'string') {
    if (data.includes('<html') || data.includes('<!DOCTYPE')) {
      const titleMatch = data.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch?.[1]?.trim();
      return title ? `서버 오류: ${title}` : fallback;
    }
    return data;
  }
  if (typeof data.error === 'string') {
    if (typeof data.details === 'string' && data.details.trim()) return `${data.error}: ${data.details}`;
    if (data.details && typeof data.details === 'object') return `${data.error}: ${JSON.stringify(data.details)}`;
    return data.error;
  }
  const parts = [];
  Object.entries(data).forEach(([k, v]) => {
    if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
    else if (typeof v === 'string') parts.push(`${k}: ${v}`);
  });
  return parts.length ? parts.join('\n') : fallback;
};

export const noOpModal = {
  alert: async (msg) => window.alert(msg),
  confirm: async (msg) => window.confirm(msg),
};

// 헬퍼 함수들
export const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password) => password && password.length >= 6;

export const getStatusColor = (status) => {
  const colors = {
    DRAFT: { bg: '#f5f5f5', text: '#666' },
    PENDING: { bg: '#ffedd5', text: '#9a3412' },
    REVIEWING: { bg: '#dbeafe', text: '#1d4ed8' },
    FINALIZED: { bg: '#d1fae5', text: '#065f46' },
  };
  return colors[status] || { bg: '#f5f5f5', text: '#666' };
};

export const formatDatetime = (dateStr) => {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('ko-KR');
  } catch {
    return dateStr;
  }
};

export const getTimeDiff = (fromDate) => {
  if (!fromDate) return '';
  const now = new Date();
  const date = new Date(fromDate);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) return `${diffDays}일 ${diffHours}시간`;
  if (diffHours > 0) return `${diffHours}시간`;
  return '방금 전';
};
