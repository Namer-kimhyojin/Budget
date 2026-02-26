
import React, { useMemo, useState } from 'react';
import { RefreshCcw, TrendingUp, Building2, Briefcase, DollarSign, PieChart, BarChart3, ChevronDown } from 'lucide-react';
import { MenuShell } from '../../shared/menuUi';

const num = (v) => Number(v || 0).toLocaleString();
const normalizeBudgetName = (year, rawName) => {
    const name = String(rawName || '').trim();
    if (!name) return '-';
    if (!year) return name;
    const escapedYear = String(year).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return name.replace(new RegExp(`^\\s*${escapedYear}\\s*년(?:도)?\\s*`), '').trim() || name;
};

export default function DashboardPage({
    menuId, version, versions, orgs, entries, subjects, projects, user,
    onRefreshEntries
}) {
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [selectedVersionId, setSelectedVersionId] = useState(null);

    // Pick latest version or use prop
    const activeVersion = useMemo(() => {
        if (selectedVersionId) return versions.find(v => v.id === selectedVersionId) || version;
        return version || (versions.length ? versions[0] : null);
    }, [version, versions, selectedVersionId]);

    // Filter entries for active version
    const versionEntries = useMemo(() => {
        if (!activeVersion) return [];
        return entries.filter(e =>
            Number(e.year) === Number(activeVersion.year) &&
            Number(e.supplemental_round ?? 0) === Number(activeVersion.round ?? 0)
        );
    }, [entries, activeVersion]);

    // Subject map
    const subjectMap = useMemo(() => {
        const m = {};
        (subjects || []).forEach(s => { m[Number(s.id)] = s; });
        return m;
    }, [subjects]);

    // Org map
    const orgMap = useMemo(() => {
        const m = {};
        (orgs || []).forEach(o => { m[Number(o.id)] = o; });
        return m;
    }, [orgs]);

    // Classify entries
    const stats = useMemo(() => {
        let totalIncome = 0, totalExpense = 0;
        const deptStats = {}; // orgId -> { name, income, expense, projectCount, laborCost, indirectCost, projectCost, entryCount }

        // Gather project IDs (수탁사업)
        const projectIds = new Set((projects || []).map(p => Number(p.id)));

        versionEntries.forEach(entry => {
            const subj = subjectMap[Number(entry.subject)];
            if (!subj) return;
            const orgId = Number(entry.organization);
            const org = orgMap[orgId];
            const orgName = org?.name || `부서#${orgId}`;
            const amount = Number(entry.total_amount || 0);
            const stype = String(subj.subject_type || '').toLowerCase();

            if (!deptStats[orgId]) {
                deptStats[orgId] = {
                    name: orgName,
                    income: 0, expense: 0,
                    projectCount: new Set(),
                    laborCost: 0, indirectCost: 0, projectCost: 0,
                    entryCount: 0,
                };
            }
            const ds = deptStats[orgId];
            ds.entryCount++;

            if (stype === 'income') {
                totalIncome += amount;
                ds.income += amount;
            } else if (stype === 'expense') {
                totalExpense += amount;
                ds.expense += amount;
            }

            // Classify by subject name/code patterns
            const name = (subj.name || '').toLowerCase();
            if (name.includes('인건비') || name.includes('급여') || name.includes('보수') || name.includes('퇴직') || name.includes('상여')) {
                ds.laborCost += amount;
            } else if (name.includes('간접비') || name.includes('일반관리') || name.includes('경상') || name.includes('관리운영')) {
                ds.indirectCost += amount;
            } else if (stype === 'expense') {
                ds.projectCost += amount;
            }

            // Count entrusted projects
            if (entry.entrusted_project && projectIds.has(Number(entry.entrusted_project))) {
                ds.projectCount.add(Number(entry.entrusted_project));
            }
        });

        // Convert Sets to counts
        Object.values(deptStats).forEach(ds => {
            ds.projectCount = ds.projectCount.size;
        });

        return {
            totalIncome,
            totalExpense,
            totalBudget: totalIncome + totalExpense,
            balance: totalIncome - totalExpense,
            totalEntries: versionEntries.length,
            totalDepts: Object.keys(deptStats).length,
            totalProjects: (projects || []).length,
            deptStats,
        };
    }, [versionEntries, subjectMap, orgMap, projects]);

    // Sorted dept list
    const deptList = useMemo(() =>
        Object.entries(stats.deptStats)
            .map(([id, ds]) => ({ id: Number(id), ...ds }))
            .sort((a, b) => (b.income + b.expense) - (a.income + a.expense)),
        [stats.deptStats]
    );

    // Organization totals
    const orgTotalLabor = deptList.reduce((s, d) => s + d.laborCost, 0);
    const orgTotalIndirect = deptList.reduce((s, d) => s + d.indirectCost, 0);
    const orgTotalProject = deptList.reduce((s, d) => s + d.projectCost, 0);
    const orgTotalProjectCount = deptList.reduce((s, d) => s + d.projectCount, 0);

    const handleRefresh = () => {
        onRefreshEntries();
        setLastUpdated(new Date());
    };

    const versionControl = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
                <select
                    value={activeVersion?.id || ''}
                    onChange={e => setSelectedVersionId(Number(e.target.value))}
                    style={{
                        padding: '5px 28px 5px 10px', borderRadius: 7,
                        border: '1px solid #e2e8f0', background: '#f8fafc',
                        fontSize: '12px', fontWeight: 600, color: '#334155',
                        appearance: 'none', cursor: 'pointer', minWidth: 140,
                    }}
                >
                    {versions.map(v => (
                        <option key={v.id} value={v.id}>
                            {v.year}년 / {normalizeBudgetName(v.year, v.name)}
                        </option>
                    ))}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
            <button onClick={handleRefresh} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7, border: '1px solid #e2e8f0',
                background: '#f8fafc', fontSize: '12px', fontWeight: 600,
                color: '#64748b', cursor: 'pointer',
            }}>
                <RefreshCcw size={12} /> 새로고침
            </button>
            {activeVersion?.status && <TopStatusBadge status={activeVersion.status} />}
        </div>
    );

    return (
        <MenuShell menuId={menuId} user={user} hideHero={true} contextBadge={versionControl}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Summary Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    <SummaryCard icon={TrendingUp} label="총 수입" value={num(stats.totalIncome)} color="#059669" bg="#ecfdf5" />
                    <SummaryCard icon={DollarSign} label="총 지출" value={num(stats.totalExpense)} color="#dc2626" bg="#fef2f2" />
                    <SummaryCard icon={PieChart} label="수지 차액" value={num(stats.balance)} color={stats.balance >= 0 ? '#059669' : '#dc2626'} bg={stats.balance >= 0 ? '#f0fdf4' : '#fef2f2'} />
                    <SummaryCard icon={BarChart3} label="예산 항목" value={`${stats.totalEntries}건`} color="#2563eb" bg="#eff6ff" />
                    <SummaryCard icon={Building2} label="참여 부서" value={`${stats.totalDepts}개`} color="#7c3aed" bg="#f5f3ff" />
                    <SummaryCard icon={Briefcase} label="수탁사업" value={`${orgTotalProjectCount}개`} color="#ea580c" bg="#fff7ed" />
                </div>

                {/* Organization-wide cost breakdown */}
                <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
                    padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        조직 전체 비용 구성
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <CostBar label="인건비" amount={orgTotalLabor} total={stats.totalExpense} color="#3b82f6" />
                        <CostBar label="사업비(프로젝트)" amount={orgTotalProject} total={stats.totalExpense} color="#10b981" />
                        <CostBar label="간접비(관리운영)" amount={orgTotalIndirect} total={stats.totalExpense} color="#f59e0b" />
                    </div>
                </div>

                {/* Department-wise detail table */}
                <div style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
                    overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>부서별 예산 현황</h3>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            마지막 갱신: {lastUpdated.toLocaleTimeString('ko-KR')}
                        </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    {['부서명', '편성 현황', '수탁사업 수', '수입', '지출', '인건비', '사업비', '간접비', '항목 수'].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 16px', textAlign: h === '부서명' ? 'left' : 'right',
                                            fontSize: '11px', fontWeight: 700, color: '#64748b',
                                            borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
                                            letterSpacing: '0.04em',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {deptList.length === 0 ? (
                                    <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>데이터가 없습니다.</td></tr>
                                ) : deptList.map((dept, idx) => (
                                    <tr key={dept.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f0f4ff'}
                                        onMouseOut={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbfc'}
                                    >
                                        <td style={{ padding: '10px 16px', fontWeight: 700, color: '#1e293b', fontSize: '13px' }}>{dept.name}</td>
                                        <td style={{ padding: '8px 16px', minWidth: 160 }}>
                                            <DeptProgressBar entries={versionEntries} orgId={dept.id} />
                                        </td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', color: '#ea580c', fontWeight: 700 }}>{dept.projectCount}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', color: '#059669', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{num(dept.income)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', color: '#dc2626', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{num(dept.expense)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', color: '#3b82f6', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{num(dept.laborCost)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', color: '#10b981', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{num(dept.projectCost)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', color: '#f59e0b', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{num(dept.indirectCost)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>{dept.entryCount}</td>
                                    </tr>
                                ))}
                                {/* Totals row */}
                                {deptList.length > 0 && (
                                    <tr style={{ background: '#f0f4ff', borderTop: '2px solid #e2e8f0' }}>
                                        <td style={{ padding: '10px 16px', fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>합계</td>
                                        <td style={{ padding: '10px 16px' }} />
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#ea580c' }}>{orgTotalProjectCount}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#059669', fontVariantNumeric: 'tabular-nums' }}>{num(stats.totalIncome)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>{num(stats.totalExpense)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#3b82f6', fontVariantNumeric: 'tabular-nums' }}>{num(orgTotalLabor)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#10b981', fontVariantNumeric: 'tabular-nums' }}>{num(orgTotalProject)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>{num(orgTotalIndirect)}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: '#64748b' }}>{stats.totalEntries}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Version info card */}
                {activeVersion && (
                    <div style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
                        padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            예산서 정보
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                            <InfoItem label="연도" value={`${activeVersion.year}년`} />
                            <InfoItem label="예산명" value={normalizeBudgetName(activeVersion.year, activeVersion.name)} />
                            <InfoItem label="상태" value={
                                activeVersion.status === 'PENDING' ? '접수중' :
                                    activeVersion.status === 'CLOSED' ? '마감' :
                                        activeVersion.status === 'CONFIRMED' ? '확정' :
                                            activeVersion.status || '-'
                            } />
                            <InfoItem label="입력 기간" value={
                                activeVersion.start_date && activeVersion.end_date
                                    ? `${activeVersion.start_date} ~ ${activeVersion.end_date}`
                                    : '미지정'
                            } />
                            <InfoItem label="회차" value={`${activeVersion.round ?? 0} 차`} />
                        </div>
                    </div>
                )}
            </div>
        </MenuShell>
    );
}

function SummaryCard({ icon, label, value, color, bg }) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'transform 0.15s, box-shadow 0.15s',
        }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
        >
            <div style={{
                width: 40, height: 40, borderRadius: 10, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                {React.createElement(icon, { size: 20, style: { color } })}
            </div>
            <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em' }}>{label}</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>{value}</div>
            </div>
        </div>
    );
}

function CostBar({ label, amount, total, color }) {
    const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{num(amount)} <span style={{ color: '#94a3b8', fontSize: '11px' }}>({pct}%)</span></span>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 999, background: color,
                    width: `${pct}%`, transition: 'width 0.4s ease',
                }} />
            </div>
        </div>
    );
}

function InfoItem({ label, value }) {
    return (
        <div style={{
            padding: '10px 14px', background: '#f8fafc', borderRadius: 8,
            border: '1px solid #f1f5f9',
        }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>{value}</div>
        </div>
    );
}

function TopStatusBadge({ status }) {
    const key = String(status || '').toUpperCase();
    let label = '대기중';
    let bg = '#f1f5f9';
    let color = '#64748b';
    let border = '#e2e8f0';

    if (key === 'PENDING') {
        label = '접수중';
        bg = '#eff6ff';
        color = '#1d4ed8';
        border = '#bfdbfe';
    } else if (key === 'EXPIRED') {
        label = '접수마감';
        bg = '#fff7ed';
        color = '#c2410c';
        border = '#fed7aa';
    } else if (key === 'CLOSED') {
        label = '마감';
        bg = '#f1f5f9';
        color = '#64748b';
        border = '#cbd5e1';
    } else if (key === 'CONFIRMED') {
        label = '확정';
        bg = '#ecfdf5';
        color = '#065f46';
        border = '#a7f3d0';
    }

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: '12px', fontWeight: 700,
            padding: '5px 10px', borderRadius: 7,
            background: bg, color, border: `1px solid ${border}`,
            marginTop: 0,
        }}>
            {label}
        </span>
    );
}

function DeptProgressBar({ entries, orgId }) {
    const deptEntries = entries.filter(e => Number(e.organization) === Number(orgId));
    const total = deptEntries.length;
    if (total === 0) return <span style={{ fontSize: 11, color: '#94a3b8' }}>항목 없음</span>;

    const filled = deptEntries.filter(e => Number(e.total_amount || 0) > 0).length;
    const pct = Math.round((filled / total) * 100);
    const barColor = pct === 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b';

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 7, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden', minWidth: 80 }}>
                <div style={{
                    height: '100%', borderRadius: 999,
                    background: barColor,
                    width: `${pct}%`,
                    transition: 'width 0.4s ease',
                }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: barColor, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
        </div>
    );
}
