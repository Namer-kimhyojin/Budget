
import React, { useMemo, useState } from 'react';
import {
    ArrowUpDown,
    Calendar, Check, CheckCircle2, Clock, Edit2, Eye, FileText,
    Layers, LayoutGrid, List, PauseCircle, PlayCircle, Plus, Trash2,
    X, CheckSquare, Square
} from 'lucide-react';

import { menuStyles } from '../../shared/menuUi';
import { VERSION_INTAKE_STRINGS as S } from './constants';

const { simpleSelect } = menuStyles;

const INTAKE_LIST_TYPO_STYLES = `
    .version-intake-list .vi-card-title {
        font-size: 20px !important;
        line-height: 1.25 !important;
    }
    .version-intake-list .vi-progress-stats {
        font-size: 10.5px !important;
    }
`;

// ── 상태별 메타 ───────────────────────────────────────────────
const STATUS_META = {
    DRAFT: { label: '\uB300\uAE30\uC911', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', dot: '#94a3b8' },
    PENDING: { label: '\uC811\uC218\uC911', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', dot: '#3b82f6' },
    EXPIRED: { label: '\uC811\uC218\uB9C8\uAC10', color: '#c2410c', bg: '#ffedd5', border: '#fdba74', dot: '#f97316' },
    CONFIRMED: { label: '\uD655\uC815', color: '#065f46', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981' },
    CLOSED: { label: '\uB9C8\uAC10', color: '#92400e', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
};

const STATUS_SORT_RANK = {
    DRAFT: 1,
    PENDING: 2,
    EXPIRED: 3,
    CONFIRMED: 4,
    CLOSED: 5,
};

const isActiveStatus = (status) => ['PENDING', 'DRAFT', 'EXPIRED'].includes(String(status || '').toUpperCase());
const toDateValue = (value) => {
    if (!value) return 0;
    const ts = new Date(value).getTime();
    return Number.isFinite(ts) ? ts : 0;
};

function compareActiveYearDesc(a, b) {
    const aActive = isActiveStatus(a.status) ? 1 : 0;
    const bActive = isActiveStatus(b.status) ? 1 : 0;
    if (bActive !== aActive) return bActive - aActive;
    if (b.year !== a.year) return b.year - a.year;
    if ((b.round || 0) !== (a.round || 0)) return (b.round || 0) - (a.round || 0);
    return String(a.id).localeCompare(String(b.id));
}

// ── D-day 계산 ────────────────────────────────────────────────
function calcDDay(endDateStr) {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    const diff = Math.ceil((end - Date.now()) / 86400000);
    if (diff === 0) return { label: 'D-Day', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' };
    if (diff > 0 && diff <= 3) return { label: `D-${diff}`, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
    if (diff > 0 && diff <= 7) return { label: `D-${diff}`, color: '#ca8a04', bg: '#fefce8', border: '#fde68a' };
    if (diff > 0) return { label: `D-${diff}`, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
    return { label: `D+${Math.abs(diff)}`, color: '#94a3b8', bg: '#f1f5f9', border: '#e2e8f0' };
}

// ── 버전 카드 ─────────────────────────────────────────────────
function VersionCard({
    item, rank, canManage,
    handleGoDetail, setVersion, setIsEditModalOpen,
    handleCloseVersion, handleReopenVersion, handleDeleteVersion,
    progressMap,
    isSelected, onToggleSelect,
}) {

    const isActive = item.status === 'PENDING' || item.status === 'DRAFT' || item.status === 'EXPIRED';
    const isClosed = item.status === 'CLOSED';
    const meta = STATUS_META[item.status] || STATUS_META.DRAFT;
    const dday = calcDDay(item.end_date);

    // 이 버전의 progress 데이터 합산
    const myProgress = useMemo(() => {
        const data = progressMap?.[item.id];
        if (!data?.length) return null;
        const total = data.length;
        if (!total) return null;
        const completed = data.filter(r => r.dept_status === 'COMPLETED').length;
        const inProgress = data.filter(r => ['WRITING', 'SUBMITTED'].includes(r.dept_status)).length;
        return { total, completed, inProgress, pct: Math.round((completed / total) * 100) };
    }, [progressMap, item.id]);

    return (
        <div style={{
            background: '#fff',
            borderRadius: 16,
            border: isActive ? `2px solid ${meta.border}` : '1px solid #e2e8f0',
            boxShadow: isActive
                ? `0 4px 20px rgba(37,99,235,0.10), 0 1px 4px rgba(0,0,0,0.04)`
                : '0 1px 4px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s, transform 0.2s',
            opacity: isClosed ? 0.72 : 1,
            position: 'relative',
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = isActive ? '0 4px 20px rgba(37,99,235,0.10)' : '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
        >
            {/* 상단 액센트 바 */}
            <div style={{ height: 4, background: isActive ? `linear-gradient(90deg, #2563eb, #60a5fa)` : meta.dot, borderRadius: '16px 16px 0 0' }} />

            {/* 카드 본문 */}
            <div style={{ padding: '21px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* 헤더 행: 연도 + 상태 뱃지 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                        <button
                            type="button"
                            className="vi-card-title"
                            title="상세 보기"
                            onClick={() => handleGoDetail(item)}
                            style={{
                                fontSize: 18,
                                fontWeight: 900,
                                color: '#0f172a',
                                lineHeight: 1.2,
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                margin: 0,
                                textAlign: 'left',
                                cursor: 'pointer',
                            }}
                        >
                            {item.name}
                        </button>
                        <div className="vi-card-meta" style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginTop: 2 }}>
                            {item.year}{S.yearUnit} · {rank}{S.rankUnit}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span className="vi-status-badge" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 999,
                            background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
                        }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
                            {meta.label}
                        </span>
                        {isActive && dday && (
                            <span className="vi-card-dday-badge" style={{
                                fontSize: 11, fontWeight: 800,
                                padding: '1px 7px', borderRadius: 999,
                                background: dday.bg, color: dday.color, border: `1px solid ${dday.border}`,
                            }}>
                                {dday.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* 기간 */}
                <div className="vi-date-row" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                    <Calendar size={13} style={{ flexShrink: 0 }} />
                    {item.start_date ? (
                        <span><b style={{ color: '#334155' }}>{item.start_date}</b> ~ <b style={{ color: '#334155' }}>{item.end_date}</b></span>
                    ) : (
                        <span style={{ color: '#cbd5e1' }}>{S.periodNotSet}</span>
                    )}
                </div>

                {/* 지침 뱃지 */}
                {item.guidelines && (
                    <div className="vi-guideline" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '3px 8px', alignSelf: 'flex-start' }}>
                        <FileText size={11} /> {S.guidelineBadge}
                    </div>
                )}

                {/* 하단 밀어내기용 스페이서 */}
                <div style={{ flex: 1 }} />

                {/* 진행 현황 바 (활성 버전만) */}
                {myProgress && (
                    <div style={{ marginTop: 0, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
                        <div className="vi-progress-head" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 5 }}>
                            <span>{S.deptProgress}</span>
                            <strong style={{ fontWeight: 800, color: myProgress.pct === 100 ? '#059669' : '#2563eb' }}>
                                {myProgress.completed}/{myProgress.total} ({myProgress.pct}%)
                            </strong>
                        </div>
                        <div style={{ height: 6, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                            <div style={{
                                height: '100%', borderRadius: 99,
                                background: myProgress.pct === 100
                                    ? 'linear-gradient(90deg,#10b981,#059669)'
                                    : 'linear-gradient(90deg,#60a5fa,#2563eb)',
                                width: `${myProgress.pct}%`,
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                        <div className="vi-progress-stats" style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', gap: 6, marginTop: 5, fontSize: 11 }}>
                            <span style={{ color: '#059669', fontWeight: 700 }}>{S.statsCompletedIcon} {myProgress.completed}</span>
                            <span style={{ color: '#d97706', fontWeight: 700 }}>{S.statsInProgressIcon} {myProgress.inProgress}</span>
                            <span style={{ color: '#94a3b8' }}>{S.statsNotStartedIcon} {myProgress.total - myProgress.completed - myProgress.inProgress}</span>
                        </div>

                    </div>
                )}
            </div>

            {/* 하단 액션 영역 */}
            <div style={{
                borderTop: '1px solid #f1f5f9',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                background: isSelected ? '#f0f7ff' : '#fafbfc',
                transition: 'background 0.2s',
            }}>
                {/* 체크박스 (좌측) */}
                {canManage && (
                    <div
                        onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
                        style={{
                            width: 18, height: 18, borderRadius: 5,
                            background: isSelected ? '#2563eb' : '#fff',
                            border: `2px solid ${isSelected ? '#2563eb' : '#cbd5e1'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            boxShadow: isSelected ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
                        }}
                        title={isSelected ? S.unselectAll : S.batchSelectTitle}
                    >
                        {isSelected && <Check size={12} color="#fff" strokeWidth={4} />}
                    </div>
                )}

                <div style={{ flex: 1 }} />


                {/* 버튼 그룹 */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <IconBtn title="상세 보기" color="#2563eb" bg="#eff6ff" onClick={() => handleGoDetail(item)}>
                        <Eye size={13} />
                    </IconBtn>
                    {canManage && (
                        <>
                            <IconBtn title={S.edit} color="#0369a1" bg="#f0f9ff" onClick={() => { setVersion(item); setIsEditModalOpen(true); }}>
                                <Edit2 size={13} />
                            </IconBtn>
                            {isClosed ? (
                                <IconBtn title={S.reopen} color="#059669" bg="#ecfdf5" onClick={() => handleReopenVersion(item)}>
                                    <PlayCircle size={13} />
                                </IconBtn>
                            ) : (
                                <IconBtn title={S.close} color="#b45309" bg="#fffbeb" onClick={() => handleCloseVersion(item)}>
                                    <PauseCircle size={13} />
                                </IconBtn>
                            )}
                            <IconBtn title={S.delete} color="#dc2626" bg="#fef2f2" onClick={() => handleDeleteVersion(item)}>
                                <Trash2 size={13} />
                            </IconBtn>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function IconBtn({ children, title, color, bg, onClick }) {
    const [hover, setHover] = useState(false);
    return (
        <button
            className="vi-icon-btn"
            title={title}
            onClick={onClick}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                width: 30, height: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${hover ? color : '#e2e8f0'}`,
                borderRadius: 8,
                background: hover ? bg : '#fff',
                color: hover ? color : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s',
            }}
        >
            {children}
        </button>
    );
}

// ── 메인 VersionList ──────────────────────────────────────────
export default function VersionList({
    versions, version, setVersion, setViewMode, canManage,
    statusById, setStatusById, saveVersionStatus,
    handleGoDetail, setIsEditModalOpen,
    handleCloseVersion, handleReopenVersion, handleDeleteVersion,
    setIsCreateModalOpen,
    progressMap,
    handleBatchDelete, handleBatchUpdateStatus,
}) {
    const [selectedIds, setSelectedIds] = useState([]);

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === versions.length && versions.length > 0) setSelectedIds([]);
        else setSelectedIds(versions.map(v => v.id));
    };


    // 요약 통계
    const summaryVersion = useMemo(() =>
        versions.find(v => v.status === 'PENDING') ||
        versions.find(v => v.status === 'DRAFT') || null
        , [versions]);

    const _dday = summaryVersion ? calcDDay(summaryVersion.end_date) : null;

    const _deptStats = useMemo(() => {
        if (!summaryVersion || !progressMap?.[summaryVersion.id]?.length) return { completed: 0, inProgress: 0, notStarted: 0, total: 0 };
        const data = progressMap[summaryVersion.id];
        const completed = data.filter(r => r.dept_status === 'COMPLETED').length;
        const inProgress = data.filter(r => ['WRITING', 'SUBMITTED'].includes(r.dept_status)).length;
        const notStarted = data.filter(r => ['NOT_STARTED', 'EMPTY'].includes(r.dept_status)).length;
        return { completed, inProgress, notStarted, total: data.length };
    }, [progressMap, summaryVersion]);

    const _versionStatusCounts = useMemo(() => {
        const counts = { DRAFT: 0, PENDING: 0, CONFIRMED: 0, CLOSED: 0 };
        versions.forEach(item => {
            const s = String(statusById[item.id] || item.status || '').toUpperCase();
            if (counts[s] !== undefined) counts[s]++;
        });
        return { total: versions.length, ...counts };
    }, [versions, statusById]);

    const _totalEntries = useMemo(() => {
        if (!summaryVersion) return 0;
        return progressMap?.[summaryVersion.id]?.reduce((s, r) => s + Number(r.total_entries || 0), 0) || 0;
    }, [progressMap, summaryVersion]);

    const _totalAmount = useMemo(() => {
        if (!summaryVersion) return 0;
        return progressMap?.[summaryVersion.id]?.reduce((s, r) => s + Number(r.total_amount || 0), 0) || 0;
    }, [progressMap, summaryVersion]);

    const [displayMode, setDisplayMode] = useState('card');
    const [sortKey, setSortKey] = useState('active_year');
    const [sortDir, setSortDir] = useState('desc');
    const sortOptions = [
        { value: 'active_year', label: S.defaultSort },
        { value: 'year', label: S.year },
        { value: 'round', label: S.round },
        { value: 'name', label: S.name },
        { value: 'status', label: S.status },
        { value: 'start_date', label: S.startDate },
        { value: 'end_date', label: S.endDate },
        { value: 'created_at', label: S.createdAt },
    ];

    const toggleSortDir = () => setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    const handleSortBy = (key) => {
        if (sortKey === key) {
            toggleSortDir();
            return;
        }
        setSortKey(key);
        setSortDir('desc');
    };
    const sortIcon = (key) => (sortKey === key ? (sortDir === 'asc' ? ' ^' : ' v') : ' -');

    // 정렬: 활성 → 연도 내림차순
    const sortedVersions = useMemo(() => {
        const list = [...versions];
        list.sort((a, b) => {
            let cmp = 0;
            if (sortKey === 'active_year') {
                cmp = compareActiveYearDesc(a, b);
                return sortDir === 'asc' ? -cmp : cmp;
            }

            switch (sortKey) {
                case 'year':
                    cmp = Number(a.year || 0) - Number(b.year || 0);
                    break;
                case 'round':
                    cmp = Number(a.round || 0) - Number(b.round || 0);
                    break;
                case 'name':
                    cmp = String(a.name || '').localeCompare(String(b.name || ''), 'ko');
                    break;
                case 'status':
                    cmp = Number(STATUS_SORT_RANK[a.status] || 99) - Number(STATUS_SORT_RANK[b.status] || 99);
                    break;
                case 'start_date':
                    cmp = toDateValue(a.start_date) - toDateValue(b.start_date);
                    break;
                case 'end_date':
                    cmp = toDateValue(a.end_date) - toDateValue(b.end_date);
                    break;
                case 'created_at':
                    cmp = toDateValue(a.created_at) - toDateValue(b.created_at);
                    break;
                default:
                    cmp = compareActiveYearDesc(a, b);
                    return sortDir === 'asc' ? -cmp : cmp;
            }

            if (cmp === 0) cmp = compareActiveYearDesc(a, b);
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return list;
    }, [versions, sortDir, sortKey]);

    // 연도별 올바른 순번 (1번째, 2번째 등)
    const versionRanks = useMemo(() => {
        const ranks = {};
        const byYear = {};
        versions.forEach(v => {
            if (!byYear[v.year]) byYear[v.year] = [];
            byYear[v.year].push(v);
        });
        Object.keys(byYear).forEach(year => {
            // 회차가 있으면 회차 우선, 같으면 ID순
            byYear[year].sort((a, b) => ((a.round || 0) - (b.round || 0)) || (String(a.id).localeCompare(String(b.id))));
            byYear[year].forEach((v, idx) => ranks[v.id] = idx + 1);
        });
        return ranks;
    }, [versions]);

    const thBase = {
        textAlign: 'left',
        borderBottom: '1px solid #e2e8f0',
        color: '#64748b',
        fontWeight: 700,
        padding: '10px 12px',
        fontSize: 12,
        background: '#f8fafc',
        whiteSpace: 'nowrap',
    };
    const thBtn = {
        ...thBase,
        cursor: 'pointer',
        userSelect: 'none',
    };
    const tdBase = {
        borderBottom: '1px solid #f1f5f9',
        padding: '10px 12px',
        color: '#334155',
        fontSize: 13,
        verticalAlign: 'middle',
    };

    return (
        <div className="version-intake-list" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <style>{INTAKE_LIST_TYPO_STYLES}</style>

            {/* ── 버전 카드 그리드 ── */}


            <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
                    <h3 className="vi-title" style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                        {S.listMainTitle}
                        <span className="vi-title-count" style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>({versions.length})</span>
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ display: 'inline-flex', border: '1px solid #cbd5e1', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
                            <button
                                className="vi-mode-btn"
                                type="button"
                                onClick={() => setDisplayMode('card')}
                                style={{
                                    border: 'none',
                                    padding: '8px 10px',
                                    background: displayMode === 'card' ? '#eff6ff' : '#fff',
                                    color: displayMode === 'card' ? '#1d4ed8' : '#64748b',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                }}
                                title={S.layoutCardTitle}
                            >
                                <LayoutGrid size={14} /> {S.layoutCard}
                            </button>
                            <button
                                className="vi-mode-btn"
                                type="button"
                                onClick={() => setDisplayMode('list')}
                                style={{
                                    border: 'none',
                                    borderLeft: '1px solid #e2e8f0',
                                    padding: '8px 10px',
                                    background: displayMode === 'list' ? '#eff6ff' : '#fff',
                                    color: displayMode === 'list' ? '#1d4ed8' : '#64748b',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                }}
                                title={S.layoutListTitle}
                            >
                                <List size={14} /> {S.layoutList}
                            </button>
                        </div>

                        <select
                            className="vi-sort-select"
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value)}
                            style={{ ...simpleSelect, minWidth: 190, fontSize: 12, padding: '8px 10px' }}
                            title={S.sortTitle}
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <button
                            className="vi-sort-btn"
                            type="button"
                            onClick={toggleSortDir}
                            style={{
                                border: '1px solid #cbd5e1',
                                borderRadius: 8,
                                background: '#fff',
                                padding: '8px 10px',
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#334155',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                            title={S.sortDirTitle}
                        >
                            <ArrowUpDown size={13} />
                            {sortDir === 'asc' ? S.sortDirAsc : S.sortDirDesc}
                        </button>

                        {canManage && (
                            <button
                                className="vi-create-btn"
                                onClick={() => setIsCreateModalOpen(true)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '8px 16px', borderRadius: 10,
                                    background: 'linear-gradient(135deg,#2563eb,#3b82f6)',
                                    color: '#fff', border: 'none', cursor: 'pointer',
                                    fontSize: 13, fontWeight: 700,
                                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                                }}
                            >
                                <Plus size={14} /> {S.newRoundBtn}
                            </button>
                        )}
                    </div>
                </div>

                {versions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 16, border: '1px dashed #e2e8f0', color: '#94a3b8', fontSize: 13 }}>
                        S.noData
                    </div>
                ) : (
                    displayMode === 'card' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', maxWidth: 1200, gap: 16 }}>
                            {sortedVersions.map((item) => (
                                <VersionCard
                                    key={item.id}
                                    item={item}
                                    rank={versionRanks[item.id]}
                                    canManage={canManage}
                                    handleGoDetail={handleGoDetail}
                                    setVersion={setVersion}
                                    setIsEditModalOpen={setIsEditModalOpen}
                                    handleDeleteVersion={handleDeleteVersion}
                                    handleCloseVersion={handleCloseVersion}
                                    handleReopenVersion={handleReopenVersion}
                                    progressMap={progressMap}
                                    isSelected={selectedIds.includes(item.id)}
                                    onToggleSelect={() => toggleSelect(item.id)}
                                />

                            ))}
                        </div>

                    ) : (
                        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
                            <table className="vi-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
                                <thead>
                                    <tr>
                                        {canManage && (
                                            <th style={{ ...thBase, width: 40, textAlign: 'center' }}>
                                                <div
                                                    onClick={toggleSelectAll}
                                                    style={{
                                                        width: 18, height: 18, borderRadius: 4,
                                                        background: selectedIds.length === versions.length && versions.length > 0 ? '#2563eb' : '#fff',
                                                        border: `2px solid ${selectedIds.length === versions.length && versions.length > 0 ? '#2563eb' : '#cbd5e1'}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer', margin: '0 auto',
                                                    }}
                                                >
                                                    {selectedIds.length === versions.length && versions.length > 0 && <Check size={12} color="#fff" strokeWidth={4} />}
                                                </div>
                                            </th>
                                        )}
                                        <th className="vi-th" style={thBtn} onClick={() => handleSortBy('name')}>{S.name}{sortIcon('name')}</th>

                                        <th className="vi-th" style={thBtn} onClick={() => handleSortBy('year')}>{S.year}{sortIcon('year')}</th>
                                        <th className="vi-th" style={thBtn} onClick={() => handleSortBy('round')}>{S.round}{sortIcon('round')}</th>
                                        <th className="vi-th" style={thBtn} onClick={() => handleSortBy('status')}>{S.status}{sortIcon('status')}</th>
                                        <th className="vi-th" style={thBtn} onClick={() => handleSortBy('start_date')}>{S.start_date || "시작일"}{sortIcon('start_date')}</th>
                                        <th className="vi-th" style={thBtn} onClick={() => handleSortBy('end_date')}>{S.endDate}{sortIcon('end_date')}</th>
                                        <th className="vi-th" style={{ ...thBase, width: 110 }}>{S.dday}</th>
                                        <th className="vi-th" style={{ ...thBase, width: 110 }}>{S.guidelinesLabel}</th>
                                        <th className="vi-th" style={{ ...thBase, width: 150, textAlign: "center" }}>{S.management}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedVersions.map((item) => {
                                        const meta = STATUS_META[item.status] || STATUS_META.DRAFT;
                                        const itemDday = calcDDay(item.end_date);
                                        const isClosed = item.status === 'CLOSED';
                                        return (
                                            <tr key={item.id} style={{
                                                opacity: isClosed ? 0.72 : 1,
                                                background: selectedIds.includes(item.id) ? '#eff6ff' : 'transparent',
                                            }}>
                                                {canManage && (
                                                    <td style={{ ...tdBase, textAlign: 'center' }}>
                                                        <div
                                                            onClick={() => toggleSelect(item.id)}
                                                            style={{
                                                                width: 18, height: 18, borderRadius: 4,
                                                                background: selectedIds.includes(item.id) ? '#2563eb' : '#fff',
                                                                border: `2px solid ${selectedIds.includes(item.id) ? '#2563eb' : '#cbd5e1'}`,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                cursor: 'pointer', margin: '0 auto',
                                                            }}
                                                        >
                                                            {selectedIds.includes(item.id) && <Check size={12} color="#fff" strokeWidth={4} />}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="vi-td" style={tdBase}>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        <button
                                                            type="button"
                                                            className="vi-list-name"
                                                            title="상세 보기"
                                                            onClick={() => handleGoDetail(item)}
                                                            style={{
                                                                color: '#0f172a',
                                                                fontWeight: 700,
                                                                background: 'none',
                                                                border: 'none',
                                                                padding: 0,
                                                                margin: 0,
                                                                textAlign: 'left',
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            {item.name}
                                                        </button>
                                                        <span className="vi-list-id" style={{ fontSize: 11, color: '#94a3b8' }}>ID {item.id}</span>
                                                    </div>
                                                </td>
                                                <td className="vi-td" style={tdBase}>{item.year}</td>
                                                <td className="vi-td" style={tdBase}>{item.round ?? 0}</td>
                                                <td className="vi-td" style={tdBase}>
                                                    <span className="vi-status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: meta.bg, color: meta.color, border: '1px solid ' + meta.border, fontSize: 11, fontWeight: 700 }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
                                                        {meta.label}
                                                    </span>
                                                </td>
                                                <td className="vi-td" style={tdBase}>{item.start_date || '-'}</td>
                                                <td className="vi-td" style={tdBase}>{item.end_date || '-'}</td>
                                                <td className="vi-td" style={tdBase}>
                                                    {itemDday ? (
                                                        <span className="vi-list-dday-badge" style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: itemDday.bg, color: itemDday.color, border: '1px solid ' + itemDday.border }}>{itemDday.label}</span>
                                                    ) : '-'}
                                                </td>
                                                <td className="vi-td" style={tdBase}>
                                                    {item.guidelines ? <span style={{ color: '#1d4ed8', fontWeight: 700, fontSize: 12 }}>{S.guidelinesExist}</span> : <span style={{ color: '#94a3b8', fontSize: 12 }}>{S.guidelinesNone}</span>}
                                                </td>
                                                <td style={{ ...tdBase, textAlign: 'center' }}>
                                                    <div style={{ display: 'inline-flex', gap: 4 }}>
                                                        <IconBtn title="상세 보기" color="#2563eb" bg="#eff6ff" onClick={() => handleGoDetail(item)}><Eye size={13} /></IconBtn>
                                                        {canManage && (
                                                            <>
                                                                <IconBtn title="수정" color="#0369a1" bg="#f0f9ff" onClick={() => { setVersion(item); setIsEditModalOpen(true); }}><Edit2 size={13} /></IconBtn>
                                                                {isClosed ? (
                                                                    <IconBtn title="재개" color="#059669" bg="#ecfdf5" onClick={() => handleReopenVersion(item)}><PlayCircle size={13} /></IconBtn>
                                                                ) : (
                                                                    <IconBtn title="마감" color="#b45309" bg="#fffbeb" onClick={() => handleCloseVersion(item)}><PauseCircle size={13} /></IconBtn>
                                                                )}
                                                                <IconBtn title="삭제" color="#dc2626" bg="#fef2f2" onClick={() => handleDeleteVersion(item)}><Trash2 size={13} /></IconBtn>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* 일괄 작업 툴바 */}
            {canManage && selectedIds.length > 0 && (
                <div style={{
                    position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    padding: '10px 14px 10px 20px', borderRadius: 20,
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', gap: 16,
                    animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}>
                    <style>{`
                        @keyframes slideUp {
                            from { transform: translate(-50%, 100%) scale(0.9); opacity: 0; }
                            to { transform: translate(-50%, 0) scale(1); opacity: 1; }
                        }
                    `}</style>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckSquare size={16} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#334155' }}>
                            <span style={{ color: '#2563eb' }}>{S.batchSelected(selectedIds.length)}</span>
                        </span>
                    </div>

                    <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />

                    <div style={{ display: 'flex', gap: 6 }}>
                        <button
                            onClick={async () => {
                                handleBatchUpdateStatus(selectedIds, 'PENDING');
                                setSelectedIds([]);
                            }}
                            style={{
                                background: '#fff', border: '1px solid #e2e8f0', color: '#334155',
                                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            <PlayCircle size={15} style={{ color: '#2563eb' }} /> {S.batchStart}
                        </button>
                        <button
                            onClick={async () => {
                                handleBatchUpdateStatus(selectedIds, 'CLOSED');
                                setSelectedIds([]);
                            }}
                            style={{
                                background: '#fff', border: '1px solid #e2e8f0', color: '#334155',
                                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                        >
                            <PauseCircle size={15} style={{ color: "#f59e0b" }} /> {S.batchClose}
                        </button>
                        <button
                            onClick={async () => {
                                await handleBatchDelete(selectedIds);
                                setSelectedIds([]);
                            }}
                            style={{
                                background: '#ef4444', border: 'none', color: '#fff',
                                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 800,
                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                                boxShadow: '0 4px 6px -1px rgba(239,68,68,0.2)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; }}
                        >
                            <Trash2 size={15} /> {S.batchDelete}
                        </button>
                    </div>

                    <div style={{ width: 1, height: 24, background: '#e2e8f0', marginLeft: 4 }} />

                    <button
                        onClick={() => setSelectedIds([])}
                        style={{
                            background: 'transparent', border: 'none', color: '#94a3b8',
                            padding: '8px', cursor: 'pointer', borderRadius: 8,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                        title={S.unselectAll}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

        </div>
    );
}


function SummaryCard({ icon, iconBg, label, value, sub }) {
    return (
        <div style={{
            background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
            padding: '16px 20px', boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
            display: 'flex', flexDirection: 'column', gap: 4,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>{label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{value}</div>
            {sub}
        </div>
    );
}

function Tag({ color, children }) {
    return (
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{children}</span>
    );
}
