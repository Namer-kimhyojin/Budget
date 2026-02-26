import { COLORS } from './shared';
const TABLE_FONT_SIZE = '13px';
const TABLE_CELL_MIN_HEIGHT = 32;

export const ledgerLayout = { display: 'flex', flexDirection: 'column', gap: 16, width: '100%', minHeight: '800px' };
export const _ctrlBar = { display: 'flex', background: '#fff', padding: '24px 32px', borderRadius: 16, border: '1px solid #e2e8f0', alignItems: 'center', gap: 32, boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)' };
export const _fBox = { display: 'flex', flexDirection: 'column', gap: 6 };
export const selPro = { padding: '10px 16px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '12pt', fontWeight: 600, background: '#f8fafc', outline: 'none', color: '#1e293b' };

export const plannerSectionTitle = { fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' };

export const plannerStatusPill = { fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: 999, border: '1px solid transparent', letterSpacing: '0.02em' };
export const plannerStatusPillOpen = { background: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' };
export const _plannerStatusPillLocked = { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' };
export const plannerSelectGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 };
export const plannerFieldBlock = { display: 'flex', flexDirection: 'column', gap: 5 };
export const plannerFieldLabel = { fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' };
export const plannerSelect = { ...selPro, width: '100%', minWidth: 0, padding: '9px 12px', fontSize: '12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', transition: 'border-color .15s' };

export const plannerModalBackdrop = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 10040, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 };
export const plannerModalCard = { width: 'min(820px, 96vw)', maxHeight: '88vh', overflow: 'hidden', background: '#fff', borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 24px 64px rgba(15, 23, 42, .28)', display: 'flex', flexDirection: 'column' };
export const plannerModalHead = { padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 };
export const plannerModalTitle = { fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' };
export const plannerModalSubTitle = { fontSize: '13px', fontWeight: 550, color: '#64748b', marginTop: 4 };
export const plannerModalBody = { padding: '16px 24px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 };

export const plannerVersionList = { display: 'flex', flexDirection: 'column', gap: 10, minHeight: 140, maxHeight: '480px', overflowY: 'auto', paddingRight: 8 };

export const plannerVersionItem = {
    border: '1.5px solid #e2e8f0',
    borderRadius: 14,
    background: '#fafbfc',
    padding: '14px 18px',
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
    position: 'relative'
};
export const plannerVersionItemActive = { borderColor: '#2563eb', background: '#eff6ff', boxShadow: '0 10px 25px -10px rgba(37,99,235,0.3)' };
export const plannerVersionTop = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 };
export const plannerVersionName = { fontSize: '15px', fontWeight: 860, color: '#0f172a', letterSpacing: '-0.02em' };
export const plannerVersionMeta = { fontSize: '12px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2, letterSpacing: '-0.01em' };

export const plannerModalScope = { border: '1.5px solid #e2e8f0', borderRadius: 12, background: '#fafbfc', padding: '16px', height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 12 };
export const plannerModalFooter = { padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 8, background: '#fafbfc', borderRadius: '0 0 18px 18px' };
export const plannerModalEmpty = { border: '1.5px dashed #cbd5e1', borderRadius: 12, background: '#f8fafc', color: '#94a3b8', fontSize: '12px', padding: '24px 12px', textAlign: 'center' };
export const _balanceCard = { display: 'flex', alignItems: 'center', gap: 24, background: '#f8fafc', padding: '12px 24px', borderRadius: 16, border: '1px solid #e2e8f0' };
export const _balItem = { display: 'flex', flexDirection: 'column', gap: 4 };
export const _balVal = { fontSize: '1.2rem', fontWeight: 950, letterSpacing: '-0.02em' };
export const _balSep = { opacity: 0.4 };
export const btnWhite = { background: '#fff', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: 10, color: '#1e293b', fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 8, fontSize: '12pt' };
export const btnPlus = { background: COLORS.blue, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', display: 'flex', gap: 8, fontSize: '12pt', boxShadow: '0 4px 6px -1px rgba(0, 89, 179, 0.2)' };
export const _modeSw = { display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12, alignSelf: 'flex-start' };
export const _mBtn = { padding: '10px 24px', border: 'none', fontSize: '12pt', fontWeight: 800, cursor: 'pointer', borderRadius: 10, transition: 'all 0.2s' };

export const sheetContainer = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, borderTopLeftRadius: 0, overflowX: 'auto', overflowY: 'visible', boxShadow: '0 2px 8px -2px rgb(15 23 42 / 0.08)' };
export const sheetTable = { minWidth: '100%', borderCollapse: 'collapse', borderSpacing: 0, fontSize: TABLE_FONT_SIZE, tableLayout: 'auto' };
export const thStyle = { background: '#f0f4fa', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', borderRight: '1px solid #dde3ed', color: '#334155', fontWeight: 700, fontSize: '10px', textAlign: 'center', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'none' };
export const thNum = { ...thStyle, textAlign: 'right' };
export const thCalcMerged = { ...thStyle, textAlign: 'left' };
export const rowGwan = { background: '#ffffff', height: TABLE_CELL_MIN_HEIGHT };
export const rowHang = { background: '#ffffff', height: TABLE_CELL_MIN_HEIGHT };
export const rowMok = { background: '#ffffff', height: TABLE_CELL_MIN_HEIGHT };
export const rowDetail = { background: '#ffffff', height: TABLE_CELL_MIN_HEIGHT };
export const tdSpanned = { padding: '2px 10px', minHeight: TABLE_CELL_MIN_HEIGHT, fontWeight: 500, borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle', color: '#1e293b', fontSize: TABLE_FONT_SIZE, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 };
export const tdEmpty = { borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle', minHeight: TABLE_CELL_MIN_HEIGHT };
export const tdBase = { padding: '2px 10px', minHeight: TABLE_CELL_MIN_HEIGHT, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', color: '#334155', fontSize: TABLE_FONT_SIZE, fontWeight: 500, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', lineHeight: 1.2 };
export const tdAmtSum = { padding: '2px 10px', minHeight: TABLE_CELL_MIN_HEIGHT, textAlign: 'right', fontWeight: 600, color: '#1e293b', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', fontSize: TABLE_FONT_SIZE, whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' };
export const tdAmtMok = { padding: '2px 10px', minHeight: TABLE_CELL_MIN_HEIGHT, textAlign: 'right', fontWeight: 600, color: '#0f4fa8', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontSize: TABLE_FONT_SIZE, whiteSpace: 'nowrap', verticalAlign: 'middle', fontVariantNumeric: 'tabular-nums' };
export const tdMokLabel = { padding: '2px 10px', minHeight: TABLE_CELL_MIN_HEIGHT, fontWeight: 600, color: '#1e293b', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontSize: TABLE_FONT_SIZE, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle', lineHeight: 1.2 };
export const tdMokLabelAction = { ...tdMokLabel, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'middle' };
export const tdMokLabelActionCompact = { ...tdMokLabelAction };
export const tdCalcBase = { ...tdBase, borderRight: 'none', whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip' };
export const tdBlank = { ...tdCalcBase, background: '#ffffff' };
export const tdBudgetBlank = { ...tdBase, background: '#ffffff', textAlign: 'right', borderRight: '1px solid #e2e8f0', padding: '2px 10px' };
export const _tdNumCell = { ...tdBase, textAlign: 'right', padding: '2px 8px' };
export const tdCalcNumCell = { ...tdCalcBase, textAlign: 'right', padding: '2px 2px', fontVariantNumeric: 'tabular-nums' };
export const tdCalcNameCell = { ...tdCalcBase, padding: '1px 4px 1px 8px', width: 300, minWidth: 200 };
export const tdCalcPriceCell = { ...tdCalcNumCell, minWidth: 100 };
export const tdCalcQtyCell = { ...tdCalcNumCell };
export const _tdCenterCell = { ...tdBase, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip', padding: '2px 4px' };
export const _tdCalcCenterCell = { ...tdCalcBase, textAlign: 'center', whiteSpace: 'nowrap', padding: '2px 4px', color: '#475569' };
export const tdCalcUnitOpCell = { ...tdCalcBase, whiteSpace: 'nowrap', padding: '2px 4px 2px 2px', color: '#334155' };
export const tdCalcAmountCell = { ...tdAmtMok, borderRight: 'none', color: '#0f172a', fontVariantNumeric: 'tabular-nums', padding: '2px 4px' };
export const tdAmtMokCompact = { ...tdAmtMok };
export const _tdCalcTailUnitCell = { ...tdCalcBase, borderRight: 'none', whiteSpace: 'nowrap', textAlign: 'left', padding: '2px 4px 2px 2px', color: '#334155' };
export const formulaUnitOpWrap = { display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-start', gap: 4 };
export const formulaOperator = { fontSize: '11px', color: '#64748b', fontWeight: 700, marginLeft: 0, marginRight: 0 };
export const _formulaBox = { display: 'flex', alignItems: 'center', gap: 6, minHeight: 26 };
export const _orderBtns = { display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.4 };
export const fName = { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: TABLE_FONT_SIZE, color: '#334155', fontWeight: 500, padding: 0, textAlign: 'left' };
export const fPrice = { minWidth: 100, maxWidth: 240, border: 'none', background: 'transparent', textAlign: 'right', outline: 'none', fontSize: TABLE_FONT_SIZE, fontWeight: 500, padding: '1px 2px' };
export const fQty = { minWidth: 30, border: 'none', background: 'transparent', textAlign: 'right', outline: 'none', fontSize: TABLE_FONT_SIZE, fontWeight: 500, padding: '1px 2px' };
export const fFreq = { minWidth: 30, border: 'none', background: 'transparent', textAlign: 'right', outline: 'none', fontSize: TABLE_FONT_SIZE, fontWeight: 500, padding: '1px 2px' };
export const fUnit = { minWidth: 30, border: 'none', background: 'transparent', textAlign: 'center', outline: 'none', fontSize: TABLE_FONT_SIZE, fontWeight: 500, padding: '1px 0' };
export const _fRes = { fontWeight: 500, minWidth: 160, textAlign: 'right', fontSize: TABLE_FONT_SIZE, color: '#0f172a' };

export const _addMin = { width: 18, height: 18, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#94a3b8', transition: 'all 0.2s' };
export const _io = { cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.2s' };
export const _ioDanger = { cursor: 'pointer', opacity: 0.3, color: COLORS.danger };
export const _lOv = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b' };
export const _lCd = { width: 400, background: '#fff', padding: '48px', borderRadius: 24, textAlign: 'center', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' };
export const _lF = { display: 'flex', alignItems: 'center', gap: 12, background: '#f1f5f9', padding: '16px 20px', borderRadius: 14, marginTop: 16 };
export const _lI = { flex: 1, border: 'none', background: 'transparent', outline: 'none' };
export const _lB = { width: '100%', marginTop: 32, background: COLORS.blue, color: '#fff', border: 'none', padding: '18px', borderRadius: 14, fontWeight: 800 };
export const _mBs = { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 };
export const _lvBadge = (lvl) => ({ fontSize: '12pt', fontWeight: 900, padding: '4px 10px', borderRadius: 6, color: '#fff', background: lvl === 1 ? '#0f172a' : lvl === 2 ? '#334155' : lvl === 3 ? '#64748b' : '#94a3b8', minWidth: 40, textAlign: 'center' });
export const _sCodeIn = { width: 110, border: 'none', borderBottom: '2px solid transparent', padding: '6px 12px', fontSize: '12pt', fontWeight: 700, outline: 'none', background: 'transparent' };
export const _sNameIn = { flex: 1, border: 'none', borderBottom: '2px solid transparent', padding: '6px 12px', fontSize: '12pt', outline: 'none', background: 'transparent' };
export const _sActGroup = { display: 'flex', gap: 8 };
export const _btnIcon = { background: '#eff6ff', border: 'none', padding: 8, cursor: 'pointer', color: COLORS.blue, borderRadius: 8 };
export const _btnIconD = { background: '#fef2f2', border: 'none', padding: 8, cursor: 'pointer', color: COLORS.danger, borderRadius: 8 };
export const mokCellWrap = { display: 'inline-flex', alignItems: 'center', minWidth: 0, maxWidth: '100%', verticalAlign: 'middle' };
export const mokInlineHead = { display: 'inline-flex', alignItems: 'center', gap: 1, maxWidth: '100%', minWidth: 0 };
export const mokNameText = {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    wordBreak: 'normal',
    overflowWrap: 'normal',
    lineHeight: 1.1,
    verticalAlign: 'middle'
};
export const mokActionPopoverWrap = { position: 'relative', display: 'inline-flex', alignItems: 'center' };
export const mokActionTrigger = {
    width: 18,
    height: 18,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 999,
    color: '#64748b',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    marginLeft: 1
};
export const mokActionPopover = {
    position: 'fixed',
    zIndex: 12000,
    minWidth: 188,
    padding: 6,
    borderRadius: 10,
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    boxShadow: '0 8px 20px -8px rgba(15, 23, 42, 0.28)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4
};
export const bubbleActionBtn = {
    width: '100%',
    border: 'none',
    background: '#f8fafc',
    color: '#334155',
    padding: '5px 7px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: '11px',
    fontWeight: 600,
    whiteSpace: 'nowrap'
};
export const bubbleActionBtnDanger = { ...bubbleActionBtn, background: '#fef2f2', color: '#b91c1c' };
export const bubbleActionBtnInfo = { ...bubbleActionBtn, background: '#f0f9ff', color: '#0369a1' };
export const _wfWrap = { display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 6 };
export const wfBadge = (status) => ({ fontSize: '11px', fontWeight: 700, padding: '1px 6px', borderRadius: 999, color: status === 'FINALIZED' ? '#065f46' : status === 'REVIEWING' ? '#1d4ed8' : status === 'PENDING' ? '#9a3412' : '#334155', background: status === 'FINALIZED' ? '#d1fae5' : status === 'REVIEWING' ? '#dbeafe' : status === 'PENDING' ? '#ffedd5' : '#e2e8f0' });
export const wfLogBtn = {
    width: 16,
    height: 16,
    borderRadius: 999,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#64748b',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    position: 'relative'
};
export const wfLogBtnNew = {
    ...wfLogBtn,
    color: '#1d4ed8',
    borderColor: '#93c5fd',
    background: '#eff6ff',
    boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.18)'
};
export const wfRejectLogBtn = { ...wfLogBtn, color: '#b91c1c', borderColor: '#fecaca', background: '#fef2f2' };
export const wfCommentBtn = { ...wfLogBtn, color: '#0369a1', borderColor: '#bae6fd', background: '#f0f9ff', width: 'auto', padding: '0 5px', gap: 2, fontSize: 9, fontWeight: 700 };
export const wfLogSparkle = {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 999,
    background: '#2563eb',
    color: '#ffffff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #ffffff'
};
// 탭 공통 로그 배너 스타일
export const tabLogBanner = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '4px 10px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderBottom: 'none',
    borderRadius: '0 10px 0 0',
    marginLeft: 'auto',
    marginBottom: -1,
    zIndex: 1,
    position: 'relative',
    maxWidth: 'fit-content',
    alignSelf: 'flex-end',
};
export const tabLogBannerLabel = { fontSize: 10, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' };

// 그룹 로그 팝오버 내부 스타일
export const logGroupSection = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '6px 8px',
    borderRadius: 8,
    background: '#f8fafc',
    border: '1px solid #e9eff6',
};
export const logGroupSectionTitle = {
    fontSize: 11,
    fontWeight: 700,
    color: '#334155',
    paddingBottom: 3,
    borderBottom: '1px solid #e2e8f0',
    marginBottom: 2,
};
export const logGroupMore = {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'right',
    paddingTop: 2,
};

export const logPopoverCard = {
    position: 'fixed',
    zIndex: 12500,
    width: 336,
    maxWidth: 'calc(100vw - 16px)',
    maxHeight: 'min(320px, calc(100vh - 16px))',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    boxShadow: '0 12px 24px -12px rgba(15, 23, 42, 0.45)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
};
export const logPopoverHead = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    padding: '10px 12px 8px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc'
};
export const logPopoverHeadText = { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 };
export const logPopoverTitle = { fontSize: 12, color: '#0f172a', lineHeight: 1.2 };
export const logPopoverSubtitle = { fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' };
export const logPopoverCloseBtn = {
    width: 20,
    height: 20,
    border: '1px solid #cbd5e1',
    borderRadius: 999,
    background: '#ffffff',
    color: '#64748b',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    cursor: 'pointer',
    flexShrink: 0
};
export const logPopoverList = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 12px',
    overflowY: 'auto',
    maxHeight: 212
};
export const logItemRow = { display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 8px', borderRadius: 8, background: '#f8fafc' };
export const logItemMeta = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 10, color: '#64748b' };
export const logItemFlow = { fontSize: 11, color: '#334155', fontWeight: 700 };
export const logItemReason = { fontSize: 11, color: '#b91c1c', lineHeight: 1.35 };
export const logItemEmpty = { padding: '8px', fontSize: 11, color: '#94a3b8', textAlign: 'center' };
export const logPopoverFoot = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '8px 12px 10px',
    borderTop: '1px solid #e2e8f0'
};
export const logPopoverCount = { fontSize: 11, color: '#64748b', fontWeight: 600 };
export const logPopoverMoreBtn = {
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#334155',
    borderRadius: 8,
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer'
};
export const wfBtn = { border: '1px solid #cbd5e1', background: '#fff', color: '#1e293b', borderRadius: 8, padding: '2px 8px', fontSize: '12pt', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };
export const wfBtnGhost = { ...wfBtn, color: '#b91c1c', borderColor: '#fecaca', background: '#fef2f2' };
export const wfBtnWarn = { ...wfBtn, color: '#92400e', borderColor: '#fcd34d', background: '#fffbeb' };
export const _overviewCard = { display: 'flex', flexDirection: 'column', gap: 10, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' };
export const _overviewTopRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' };
export const _overviewMetricGroup = { display: 'flex', alignItems: 'stretch', gap: 8, flexWrap: 'wrap' };
export const _overviewMetric = { minWidth: 140, display: 'flex', flexDirection: 'column', gap: 2, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px' };
export const _overviewMetricLabel = { fontSize: '12pt', color: '#64748b', fontWeight: 700 };
export const _overviewMetricValue = { fontSize: '12pt', fontWeight: 900, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' };
export const _overviewStatusArea = { display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '4px 10px' };
export const _overviewStatusText = { fontSize: '12pt', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap' };
export const _overviewFlowWrap = { display: 'flex', flexDirection: 'column', gap: 6 };
export const _overviewTrack = { width: '100%', height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' };
export const _overviewTrackFill = { height: '100%', borderRadius: 999, background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)', transition: 'width 0.25s ease' };
export const _overviewSteps = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' };
export const _overviewStepItem = { display: 'inline-flex', alignItems: 'center', gap: 6 };
export const _overviewStepDot = { width: 7, height: 7, borderRadius: 999, display: 'inline-block' };
export const _overviewStepText = { fontSize: '12pt', fontWeight: 700, whiteSpace: 'nowrap' };
export const _overviewHint = { fontSize: '12pt', color: '#64748b', fontWeight: 500 };
export const _overviewActionRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' };
export const _overviewPermissionText = { fontSize: '12pt', color: '#64748b', fontWeight: 500 };
export const _flowGuide = { display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', color: '#475569', fontSize: '12pt', fontWeight: 500 };
export const _deptFlowPanel = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px' };
export const tableBottomPad = { height: 14, background: '#ffffff' };
export const _explorerCard = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '32px', minHeight: 600, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' };
export const _subjectRow = { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, transition: 'background 0.2s' };
export const _subjectIcon = { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 8, background: '#f1f5f9' };
export const _lvlBadge = (lvl) => ({ fontSize: '12pt', fontWeight: 900, padding: '3px 8px', borderRadius: 6, color: '#fff', background: lvl === 1 ? '#0f172a' : lvl === 2 ? '#334155' : lvl === 3 ? '#64748b' : '#94a3b8', minWidth: 36, textAlign: 'center' });
export const _masterWrapper = { display: 'flex', flexDirection: 'column', gap: 32 };
export const _mH = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
export const _btnLink = { background: '#eff6ff', border: 'none', color: COLORS.blue, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '12pt', fontWeight: 500 };
export const toastViewport = {
    position: 'fixed',
    top: 84,
    right: 16,
    zIndex: 13000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    pointerEvents: 'none',
};
export const toastItem = {
    minWidth: 220,
    maxWidth: 420,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: '12px',
    fontWeight: 700,
    boxShadow: '0 8px 18px -10px rgba(15, 23, 42, 0.4)',
    background: '#fff',
};
export const toastItemSuccess = { color: '#065f46', borderColor: '#a7f3d0', background: '#ecfdf5' };
export const toastItemError = { color: '#991b1b', borderColor: '#fecaca', background: '#fef2f2' };
