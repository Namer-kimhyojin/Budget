export const LVL_COLORS = ['#1d4ed8', '#0891b2', '#059669', '#d97706'];
export const LVL_BG = ['#eff6ff', '#ecfeff', '#ecfdf5', '#fffbeb'];
export const LVL_BORDER = ['#bfdbfe', '#a5f3fc', '#6ee7b7', '#fde68a'];
export const LVL_NAMES = ['장', '관', '항', '목'];
export const LVL_DESC = [
    '기능별·성질별 분류의 가장 큰 단위로 정책의 대분류 역할을 합니다.',
    '장의 세부 구분으로 정책사업의 목표를 구체화하는 중분류 단위입니다.',
    '실질적인 사업단위(정책사업/단위사업)로 예산통제의 주요 기준이 됩니다.',
    '예산이 지출되는 구체적인 용도와 성질을 나타냅니다. (인건비, 운영비 등)'
];
export const LINE_W = 20;

export const SNAPSHOT_KEY_PREFIX = 'subject_snapshot_';

// 계층별 들여쓰기 단위 (px)
export const INDENT = 20;
// 계층별 기본 배경 / 호버 배경 (CSS var로 주입)
export const LVL_ROW_BG = ['#f4f7ff', '#f7fffd', '#f9fffc', 'transparent'];
export const LVL_ROW_HOV = ['#e0ecff', '#d8fff8', '#dffff4', '#fff9e6'];
export const LVL_TOP_BORDER = ['2px solid #d8e2f4', '1px solid #e6eff8', '1px solid #f0f4f8', '1px solid #f3f3f3'];

export const modalOverlay = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.45)',
    zIndex: 9000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(3px)',
};

export const modalCard = {
    background: '#fff',
    borderRadius: 14,
    width: 420,
    boxShadow: '0 20px 40px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden',
};

export const modalHeader = {
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc',
};

export const modalFooter = {
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
};

export const formLabel = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: 5,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
};

export const formInput = {
    border: '1px solid #cbd5e1',
    borderRadius: 7,
    padding: '8px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
};

export const btnPrimary = {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
};

export const btnCancel = {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: 7,
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
};

export const _orgInp = {
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: '11px',
    padding: '6px 8px',
    outline: 'none',
};

export const _orgSel = {
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    fontSize: '11px',
    padding: '6px 8px',
    outline: 'none',
    background: '#fff',
};

export const thS = {
    padding: '8px 10px',
    fontSize: '11px',
    color: '#64748b',
    textAlign: 'left',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: 700,
};

export const tdS = {
    padding: '7px 12px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '12px',
};

export const eInp = {
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    fontSize: '11px',
    padding: '4px 6px',
    width: '100%',
    outline: 'none',
};

export const eSel = {
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    fontSize: '11px',
    padding: '4px 6px',
    width: '100%',
    outline: 'none',
    background: '#fff',
};

export const btnS = {
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '3px 8px',
    fontSize: '10px',
    cursor: 'pointer',
};

export const _btnE = {
    background: '#eff6ff',
    color: '#2563eb',
    border: '1px solid #bfdbfe',
    borderRadius: 4,
    padding: '3px 8px',
    fontSize: '10px',
    cursor: 'pointer',
};

export const _btnD = {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: 4,
    padding: '3px 8px',
    fontSize: '10px',
    cursor: 'pointer',
};

export const _selPro = {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    fontSize: '12pt',
    fontWeight: 600,
    background: '#f8fafc',
    outline: 'none',
    color: '#1e293b',
};
