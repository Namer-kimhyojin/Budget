/* eslint-disable react-hooks/preserve-manual-memoization */
import React, { useState, useMemo } from 'react';
import {
    ArrowLeft,
    BarChart3,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    Hash,
    Lock,
    Settings,
    TrendingUp,
    Unlock,
    DollarSign,
} from 'lucide-react';
import { menuStyles, LoadingSpinner, StatusBadge } from '../../shared/menuUi';
import { VERSION_INTAKE_STRINGS as S } from './constants';

const { menuGhostBtn } = menuStyles;

const actionBtn = {
    ...menuGhostBtn,
    padding: '8px 14px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
};

const toDateLabel = (value) => {
    if (!value) return '-';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value);
    return dt.toLocaleDateString('ko-KR');
};

// ── 부서 상태 메타 ─────────────────────────────────────────────
const DEPT_STATUS_STYLE = {
    COMPLETED: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534', barColor: '#10b981', label: '완료' },
    SUBMITTED: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', barColor: '#3b82f6', label: '제출됨' },
    WRITING: { bg: '#fffbeb', border: '#fde68a', color: '#b45309', barColor: '#f59e0b', label: '작성중' },
    NOT_STARTED: { bg: '#f8fafc', border: '#e2e8f0', color: '#94a3b8', barColor: '#cbd5e1', label: '미시작' },
    EMPTY: { bg: '#f8fafc', border: '#e2e8f0', color: '#cbd5e1', barColor: '#e2e8f0', label: '항목없음' },
};

function calcCompletionRate(progressData) {
    if (!progressData.length) return 0;
    const done = progressData.filter(r => r.dept_status === 'COMPLETED').length;
    return Math.round((done / progressData.length) * 100);
}

// ── 정보 요약 카드 ─────────────────────────────────────────────
function InfoCard({ icon, iconColor, iconBg, label, value, sub }) {
    return (
        <div style={{
            background: '#fff',
            border: '1px solid #e8edf5',
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: iconBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                {React.cloneElement(icon, { size: 17, style: { color: iconColor } })}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1.3 }}>{value}</div>
                {sub && <div style={{ marginTop: 4 }}>{sub}</div>}
            </div>
        </div>
    );
}

// ── 완료율 게이지 ─────────────────────────────────────────────
function CompletionGauge({ rate }) {
    const color = rate === 100 ? '#059669' : rate >= 60 ? '#2563eb' : '#f59e0b';
    const bgColor = rate === 100 ? '#ecfdf5' : rate >= 60 ? '#eff6ff' : '#fffbeb';
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: bgColor, border: `1px solid ${color}22`,
            borderRadius: 12, padding: '10px 16px',
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ height: 8, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: 99,
                        background: rate === 100
                            ? 'linear-gradient(90deg,#10b981,#059669)'
                            : 'linear-gradient(90deg,#60a5fa,#2563eb)',
                        width: `${rate}%`,
                        transition: 'width 0.5s ease',
                    }} />
                </div>
            </div>
            <span style={{ fontSize: 15, fontWeight: 900, color, minWidth: 44, textAlign: 'right' }}>
                {rate}%
            </span>
        </div>
    );
}

export default function VersionDetail({
    version,
    canManage,
    setViewMode,
    fetchProgress,
    progressData = [],
    loadingProgress,
    setIsEditModalOpen,
    onExportBudgetBook,
    onClose,
    onReopen,
}) {
    const totalEntries = progressData.reduce((sum, row) => sum + Number(row.total_entries || 0), 0);
    const totalAmount = progressData.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
    const completionRate = calcCompletionRate(progressData);
    const isClosed = version?.status === 'CLOSED';

    const [expandedDepts, setExpandedDepts] = useState({});
    const toggleDept = (id) => setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));

    const deptComplete = progressData.filter(r => r.dept_status === 'COMPLETED').length;
    const deptInProgress = progressData.filter(r => ['WRITING', 'SUBMITTED'].includes(r.dept_status)).length;

    const groupedProgress = useMemo(() => {
        const groups = {};
        progressData.forEach(row => {
            const id = row.org_id;
            const pid = row.parent_id;
            const deptId = pid ? pid : id;
            if (!groups[deptId]) groups[deptId] = { dept: null, teams: [] };
            if (!pid) groups[deptId].dept = { ...row };
            else groups[deptId].teams.push({ ...row });
        });

        return Object.values(groups).map(g => {
            if (!g.dept) {
                if (!g.teams.length) return null;
                g.dept = { ...g.teams[0], org_name: `${g.teams[0].org_name} (그룹)`, isPlaceholder: true };
            }
            if (g.teams.length > 0) {
                const agg = g.teams.reduce((acc, t) => {
                    acc.total_entries += Number(t.total_entries || 0);
                    acc.total_amount += Number(t.total_amount || 0);
                    acc.finalized += Number(t.status_counts?.FINALIZED || 0);
                    return acc;
                }, {
                    total_entries: Number(g.dept.total_entries || 0),
                    total_amount: Number(g.dept.total_amount || 0),
                    finalized: Number(g.dept.status_counts?.FINALIZED || 0),
                });
                g.dept.total_entries = agg.total_entries;
                g.dept.total_amount = agg.total_amount;
                const barPct = agg.total_entries > 0 ? Math.round((agg.finalized / agg.total_entries) * 100) : 0;
                g.dept.aggregatedBarPct = barPct;
                if (agg.total_entries > 0) {
                    if (barPct === 100) g.dept.dept_status = 'COMPLETED';
                    else if (barPct > 0) g.dept.dept_status = 'SUBMITTED';
                    else g.dept.dept_status = 'WRITING';
                }
            } else {
                const total = Number(g.dept.total_entries || 0);
                const fin = Number(g.dept.status_counts?.FINALIZED || 0);
                g.dept.aggregatedBarPct = total > 0 ? Math.round((fin / total) * 100) : 0;
            }
            return g;
        }).filter(Boolean).sort((a, b) => (a.dept.org_name || '').localeCompare(b.dept.org_name || ''));
    }, [progressData]);

    const handleDownloadDeptReport = (orgId) => {
        window.location.assign(`/api/versions/${version.id}/export-department-budget/?org_id=${orgId}`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ── 상단 액션 바 ── */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: 10,
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 14, padding: '14px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button type="button" style={actionBtn} onClick={() => setViewMode('list')}>
                        <ArrowLeft size={14} /> {S.goToList}
                    </button>
                    <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                        {version?.year}년 {version?.name}
                    </span>
                    <StatusBadge status={version?.status} type="version" />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" style={actionBtn} onClick={() => fetchProgress()}>
                        <BarChart3 size={14} /> {S.refreshStatus}
                    </button>
                    <button type="button" style={actionBtn} onClick={onExportBudgetBook}>
                        <Download size={14} /> {S.exportOfficialBook}
                    </button>
                    {canManage && (
                        <button type="button" style={actionBtn} onClick={() => setIsEditModalOpen(true)}>
                            <Settings size={14} /> {S.editRoundBtn}
                        </button>
                    )}
                    {canManage && version && (
                        !isClosed ? (
                            <button type="button" onClick={() => onClose?.(version)} style={{ ...actionBtn, border: '1px solid #fca5a5', background: '#fff1f2', color: '#b91c1c' }}>
                                <Lock size={14} /> 회차 마감
                            </button>
                        ) : (
                            <button type="button" onClick={() => onReopen?.(version)} style={{ ...actionBtn, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534' }}>
                                <Unlock size={14} /> 마감 해제
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* ── 버전 정보 카드 그리드 ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                <InfoCard
                    icon={<Hash />}
                    iconColor="#6366f1"
                    iconBg="#eef2ff"
                    label="예산 회차"
                    value={`${version?.year}년 / ${version?.name || `${version?.round ?? 0}차`}`}
                />
                <InfoCard
                    icon={<Calendar />}
                    iconColor="#0ea5e9"
                    iconBg="#f0f9ff"
                    label="입력 기간"
                    value={`${toDateLabel(version?.start_date)} ~ ${toDateLabel(version?.end_date)}`}
                />
                <InfoCard
                    icon={<FileText />}
                    iconColor="#f59e0b"
                    iconBg="#fffbeb"
                    label="총 예산 항목"
                    value={`${totalEntries.toLocaleString()}건`}
                />
                <InfoCard
                    icon={<DollarSign />}
                    iconColor="#10b981"
                    iconBg="#ecfdf5"
                    label="총 예산 금액"
                    value={totalAmount > 0 ? `${totalAmount.toLocaleString()}원` : '집계 전'}
                />
                <InfoCard
                    icon={<CheckCircle2 />}
                    iconColor="#059669"
                    iconBg="#ecfdf5"
                    label="부서 완료 현황"
                    value={progressData.length > 0 ? `${deptComplete} / ${progressData.length}` : '—'}
                    sub={progressData.length > 0 && (
                        <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                            <span style={{ color: '#059669', fontWeight: 700 }}>✅ 완료 {deptComplete}</span>
                            <span style={{ color: '#d97706', fontWeight: 700 }}>⏳ 진행 {deptInProgress}</span>
                            <span style={{ color: '#94a3b8' }}>⚪ 미시작 {progressData.length - deptComplete - deptInProgress}</span>
                        </div>

                    )}
                />
                <InfoCard
                    icon={<TrendingUp />}
                    iconColor="#2563eb"
                    iconBg="#eff6ff"
                    label="전체 완료율"
                    value={progressData.length > 0 ? `${completionRate}%` : '—'}
                    sub={progressData.length > 0 && (
                        <div style={{ height: 5, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden', marginTop: 6 }}>
                            <div style={{
                                height: '100%', borderRadius: 99,
                                background: completionRate === 100
                                    ? 'linear-gradient(90deg,#10b981,#059669)'
                                    : 'linear-gradient(90deg,#60a5fa,#2563eb)',
                                width: `${completionRate}%`,
                                transition: 'width 0.5s',
                            }} />
                        </div>
                    )}
                />
            </div>

            {/* ── 부서별 진행 현황 ── */}
            <div style={{
                background: '#fff', border: '1px solid #e2e8f0',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
                {/* 헤더 */}
                <div style={{
                    padding: '16px 22px', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#f8fafc',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                        <BarChart3 size={16} style={{ color: '#3b82f6' }} />
                        {S.progressByDept}
                    </div>
                    {progressData.length > 0 && (
                        <div style={{ minWidth: 220 }}>
                            <CompletionGauge rate={completionRate} />
                        </div>
                    )}
                </div>

                {/* 테이블 */}
                {loadingProgress ? (
                    <div style={{ padding: 60 }}>
                        <LoadingSpinner message={S.loadingProgress} />
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                {[
                                    { label: S.dept, align: 'left', pl: 22 },
                                    { label: S.status, align: 'center', w: 100 },
                                    { label: '진행률', align: 'left', w: 180 },
                                    { label: S.entryCount, align: 'right' },
                                    { label: S.totalAmount, align: 'right' },
                                    { label: '출력', align: 'right', pr: 22 },
                                ].map(({ label, align, w, pl, pr }) => (
                                    <th key={label} style={{
                                        padding: '10px 14px',
                                        ...(pl ? { paddingLeft: pl } : {}),
                                        ...(pr ? { paddingRight: pr } : {}),
                                        ...(w ? { width: w } : {}),
                                        textAlign: align,
                                        fontSize: 11, fontWeight: 700, color: '#64748b',
                                        letterSpacing: '0.04em', whiteSpace: 'nowrap',
                                    }}>{label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {!groupedProgress.length ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                                        {S.noProgressData}
                                    </td>
                                </tr>
                            ) : groupedProgress.map((group, idx) => {
                                const row = group.dept;
                                const st = DEPT_STATUS_STYLE[row.dept_status] || DEPT_STATUS_STYLE.NOT_STARTED;
                                const barPct = row.aggregatedBarPct ?? 0;
                                const isExpanded = expandedDepts[row.org_id];
                                const hasTeams = group.teams.length > 0;

                                return (
                                    <React.Fragment key={idx}>
                                        <tr
                                            style={{
                                                background: idx % 2 === 0 ? '#fff' : '#fafbfc',
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: hasTeams ? 'pointer' : 'default',
                                                transition: 'background 0.12s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#f0f4ff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'; }}
                                            onClick={() => hasTeams && toggleDept(row.org_id)}
                                        >
                                            <td style={{ padding: '11px 14px', paddingLeft: 22, fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                    {hasTeams ? (
                                                        isExpanded
                                                            ? <ChevronUp size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                                                            : <ChevronDown size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                                                    ) : <div style={{ width: 13 }} />}
                                                    {row.org_name || '-'}
                                                    {hasTeams && (
                                                        <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', borderRadius: 4, padding: '1px 5px' }}>
                                                            {group.teams.length}팀
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                                    fontSize: 11, fontWeight: 700,
                                                    padding: '3px 9px', borderRadius: 999,
                                                    background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                                                }}>
                                                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.barColor, display: 'inline-block' }} />
                                                    {st.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '11px 14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ flex: 1, height: 7, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%', borderRadius: 99,
                                                            background: row.dept_status === 'COMPLETED'
                                                                ? 'linear-gradient(90deg,#10b981,#059669)'
                                                                : `linear-gradient(90deg,${st.barColor}99,${st.barColor})`,
                                                            width: `${barPct}%`,
                                                            transition: 'width 0.4s',
                                                        }} />
                                                    </div>
                                                    <span style={{ fontSize: 11, fontWeight: 800, color: st.color, minWidth: 34, textAlign: 'right' }}>
                                                        {barPct}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
                                                {Number(row.total_entries || 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                                                {Number(row.total_amount || 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: '11px 14px', paddingRight: 22, textAlign: 'right' }}>
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleDownloadDeptReport(row.org_id); }}
                                                    style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: 5,
                                                        fontSize: 11, fontWeight: 700,
                                                        padding: '5px 12px', borderRadius: 7,
                                                        background: '#fff', border: '1px solid #e2e8f0',
                                                        color: '#334155', cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                                                >
                                                    <Download size={12} /> 예산서
                                                </button>
                                            </td>
                                        </tr>

                                        {/* 팀 펼침 행 */}
                                        {isExpanded && group.teams.map(team => {
                                            const tst = DEPT_STATUS_STYLE[team.dept_status] || DEPT_STATUS_STYLE.NOT_STARTED;
                                            const t_total = Number(team.total_entries || 0);
                                            const t_fin = Number(team.status_counts?.FINALIZED || 0);
                                            const t_pct = t_total > 0 ? Math.round((t_fin / t_total) * 100) : 0;
                                            return (
                                                <tr key={team.org_id} style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '9px 14px 9px 44px', color: '#475569', fontSize: 12 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ color: '#cbd5e1' }}>└</span>
                                                            {team.org_name || '-'}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                                                        <span style={{
                                                            display: 'inline-block', fontSize: 10, fontWeight: 700,
                                                            padding: '2px 7px', borderRadius: 999,
                                                            background: tst.bg, color: tst.color, border: `1px solid ${tst.border}`,
                                                        }}>{tst.label}</span>
                                                    </td>
                                                    <td style={{ padding: '9px 14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <div style={{ flex: 1, height: 5, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
                                                                <div style={{ height: '100%', borderRadius: 99, background: tst.barColor, width: `${t_pct}%` }} />
                                                            </div>
                                                            <span style={{ fontSize: 11, fontWeight: 700, color: tst.color, minWidth: 34, textAlign: 'right' }}>{t_pct}%</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>{t_total.toLocaleString()}</td>
                                                    <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#334155', fontVariantNumeric: 'tabular-nums' }}>{Number(team.total_amount || 0).toLocaleString()}</td>
                                                    <td />
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
