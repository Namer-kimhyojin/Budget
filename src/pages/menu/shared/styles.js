
// 1. Define all style constants physically
const menuBaseWrap = { display: 'flex', flexDirection: 'column', gap: 16 };
const menuHeroCard = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 18px' };
const menuHeroTop = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 };
const menuHeroTitleBlock = { display: 'flex', flexDirection: 'column', gap: 6 };
const menuHeroTitle = { margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' };
const menuHeroDesc = { margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.5 };
const menuHeroTag = { fontSize: '12px', fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', borderRadius: 999, padding: '4px 10px' };
const menuHeroActionRow = { marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' };
const menuStatGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 };
const menuStatCard = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' };
const menuStatLabel = { fontSize: '12px', color: '#64748b', fontWeight: 600 };
const menuStatValue = { marginTop: 4, fontSize: '18px', color: '#0f172a', fontWeight: 800 };

const menuGhostBtn = {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#334155',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
};

const wizardContainer = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 };
const wizardTitle = { margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' };
const wizardProgress = { display: 'flex', gap: 8, justifyContent: 'center' };
const wizardStep = { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' };
const wizardContent = { minHeight: 120, display: 'flex', flexDirection: 'column', gap: 10 };
const wizardStepLabel = { fontSize: '14px', fontWeight: 700, color: '#1e293b' };
const wizardFooter = { display: 'flex', gap: 8, justifyContent: 'flex-end' };
const wizardBtn = { padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontSize: '14px', fontWeight: 600, cursor: 'pointer' };

const timelineContainer = { display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' };
const timelineItem = { display: 'flex', gap: 12 };
const timelineMarker = { width: 24, height: 24, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0, marginTop: 2 };
const timelineContent = { flex: 1, display: 'flex', flexDirection: 'column', gap: 4 };
const timelineTime = { fontSize: '12px', color: '#94a3b8', fontWeight: 600 };
const timelineTitle = { fontSize: '14px', fontWeight: 700, color: '#1e293b' };
const timelineDesc = { fontSize: '13px', color: '#475569' };
const timelineActor = { fontSize: '12px', color: '#64748b', fontWeight: 600 };
const timelineReason = { fontSize: '12px', color: '#64748b', fontStyle: 'italic' };
const emptyTimeline = { textAlign: 'center', padding: '24px 16px', color: '#94a3b8', fontSize: '14px' };

const presetCardContainer = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' };
const presetCardHead = { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 700, color: '#1e293b', background: '#f8fafc' };
const presetCardBody = { padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 };
const presetEmpty = { textAlign: 'center', padding: '12px 8px', color: '#94a3b8', fontSize: '13px' };
const presetList = { display: 'flex', flexDirection: 'column', gap: 6 };
const presetItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#f8fafc', borderRadius: 6 };
const presetItemName = { fontSize: '13px', fontWeight: 600, color: '#334155' };
const presetItemActions = { display: 'flex', gap: 4 };
const presetActionBtn = { border: 'none', background: 'transparent', color: '#3b82f6', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '2px 6px' };
const presetInputRow = { display: 'flex', gap: 6 };
const presetInput = { flex: 1, border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 8px', fontSize: '13px', outline: 'none' };
const presetSaveBtn = { padding: '6px 10px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' };
const presetCancelBtn = { padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontSize: '13px', fontWeight: 600, cursor: 'pointer' };
const presetNewBtn = { padding: '8px 12px', borderRadius: 6, border: '1px solid #3b82f6', background: '#eff6ff', color: '#1e40af', fontSize: '13px', fontWeight: 600, cursor: 'pointer', width: '100%', textAlign: 'center' };

const selectTableWrapper = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' };
const selectActionBar = { padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' };
const selectActionBtn = { border: 'none', color: '#fff', borderRadius: 8, padding: '6px 10px', fontSize: '13px', fontWeight: 600 };

const simpleLabel = { minWidth: 80, color: '#475569', fontWeight: 600 };
const simpleInput = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: '14px', minWidth: 160, outline: 'none', background: '#fff' };
const simpleSelect = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 10px', fontSize: '14px', minWidth: 150, background: '#fff', outline: 'none', cursor: 'pointer' };
const simpleTextarea = { width: '100%', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 12px', fontSize: '14px', resize: 'vertical', outline: 'none' };
const simpleTable = { width: '100%', borderCollapse: 'collapse', fontSize: '14px' };
const simpleTh = { textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600, padding: '8px 10px', fontSize: '14px', background: '#f8fafc' };
const simpleTd = { borderBottom: '1px solid #f1f5f9', padding: '8px 10px', color: '#334155', fontSize: '14px', verticalAlign: 'middle' };
const emptyData = { textAlign: 'center', padding: 120, color: '#94a3b8', fontSize: '14px' };
const noticeAlert = { padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: '14px', marginBottom: 16 };
const rowInline = { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' };

// Panel Styles
const menuPanelCard = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, minHeight: 140, overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const menuPanelHead = { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '14px', fontWeight: 700, color: '#1e293b', background: '#f8fafc', flexShrink: 0 };
const menuPanelBody = { padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 };

const breadcrumbWrap = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    marginBottom: '4px',
    fontSize: '13px',
    color: '#64748b'
};

const breadcrumbLeft = {
    display: 'flex',
    alignItems: 'center',
    gap: 8
};

const breadcrumbBadge = {
    background: '#eff6ff',
    color: '#3b82f6',
    padding: '4px 12px',
    borderRadius: '999px',
    fontWeight: 700,
    fontSize: '12px'
};

// 2. Export menuStyles aggregtating all constants
export const menuStyles = {
    menuBaseWrap,
    menuHeroCard,
    menuHeroTop,
    menuHeroTitleBlock,
    menuHeroTitle,
    menuHeroDesc,
    menuHeroTag,
    menuHeroActionRow,
    menuStatGrid,
    menuStatCard,
    menuStatLabel,
    menuStatValue,
    menuGhostBtn,
    wizardContainer,
    wizardTitle,
    wizardProgress,
    wizardStep,
    wizardContent,
    wizardStepLabel,
    wizardFooter,
    wizardBtn,
    timelineContainer,
    timelineItem,
    timelineMarker,
    timelineContent,
    timelineTime,
    timelineTitle,
    timelineDesc,
    timelineActor,
    timelineReason,
    emptyTimeline,
    presetCardContainer,
    presetCardHead,
    presetCardBody,
    presetEmpty,
    presetList,
    presetItem,
    presetItemName,
    presetItemActions,
    presetActionBtn,
    presetInputRow,
    presetInput,
    presetSaveBtn,
    presetCancelBtn,
    presetNewBtn,
    selectTableWrapper,
    selectActionBar,
    selectActionBtn,
    simpleLabel,
    simpleInput,
    simpleSelect,
    simpleTextarea,
    simpleTable,
    simpleTh,
    simpleTd,
    emptyData,
    noticeAlert,
    rowInline,
    menuPanelCard,
    menuPanelHead,
    menuPanelBody,
    breadcrumbWrap,
    breadcrumbLeft,
    breadcrumbBadge,
};
