export const COLORS = {
  blue: '#0059b3',
  sidebar: '#0f172a',
  bg: '#fcfcfd',
  border: '#e2e8f0',
  muted: '#64748b',
  success: '#10b981',
  danger: '#ef4444',
  income: '#0369a1',
  expense: '#be123c',
  white: '#ffffff',
};

export const num = (v) => (Number(v) || 0).toLocaleString();
export const varianceNum = (v) => {
  const value = Number(v) || 0;
  if (value < 0) return `△${Math.abs(value).toLocaleString()}`;
  return value.toLocaleString();
};
const toThousand = (v) => Math.trunc((Number(v) || 0) / 1000);
export const numInThousand = (v) => toThousand(v).toLocaleString();
export const varianceNumInThousand = (v) => {
  const value = toThousand(v);
  if (value < 0) return `△${Math.abs(value).toLocaleString()}`;
  return value.toLocaleString();
};

export const formatDate = (v) => {
  if (!v) return '미지정';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '미지정';
  return d.toLocaleDateString('ko-KR');
};

export const toDateOnly = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

export const dayDiff = (a, b) => Math.ceil((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));

export const apiErrorMessage = (e, fallback = '오류가 발생했습니다.') => {
  const data = e?.response?.data;
  if (!data) {
    const status = e?.response?.status;
    const msg = e?.message || 'Network Error';
    return status ? `${fallback} (HTTP ${status})` : `${fallback} (${msg})`;
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
    const trace = typeof data.trace_id === 'string' ? ` [trace_id: ${data.trace_id}]` : '';
    if (typeof data.details === 'string' && data.details.trim()) return `${data.error}: ${data.details}${trace}`;
    if (data.details && typeof data.details === 'object') return `${data.error}: ${JSON.stringify(data.details)}${trace}`;
    return `${data.error}${trace}`;
  }
  const parts = [];
  Object.entries(data).forEach(([k, v]) => {
    if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
    else if (typeof v === 'string') parts.push(`${k}: ${v}`);
  });
  if (typeof data.trace_id === 'string') parts.push(`trace_id: ${data.trace_id}`);
  return parts.length ? parts.join('\n') : fallback;
};

export const getNextProjectAutoCode = (year, projects) => {
  if (!year || !projects || !Array.isArray(projects)) return '';
  const prefix = `B${year}-`;
  const yearProjects = projects.filter(p => p.code && typeof p.code === 'string' && p.code.startsWith(prefix));
  let maxIdx = 0;
  yearProjects.forEach(p => {
    const parts = p.code.split('-');
    if (parts.length > 1) {
      const idx = parseInt(parts[1], 10);
      if (!isNaN(idx) && idx > maxIdx) maxIdx = idx;
    }
  });
  return `${prefix}${String(maxIdx + 1).padStart(2, '0')}`;
};

export const generateInternalCode = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AUTO_${ts}_${rand}`;
};

export const generateOrgCode = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `ORG_${ts}_${rand}`;
};

export const copyTextToClipboard = async (text) => {
  const payload = String(text || '');
  if (!payload) return false;
  try {
    if (navigator?.clipboard?.writeText) { await navigator.clipboard.writeText(payload); return true; }
  } catch { /* fallback */ }
  try {
    const area = document.createElement('textarea');
    area.value = payload; area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.appendChild(area); area.select();
    const ok = document.execCommand('copy'); document.body.removeChild(area); return !!ok;
  } catch { return false; }
};
