
import React from 'react';
import { menuStyles, InfoBox, EmptyState } from '../../shared/menuUi';
import { HQ_REVIEW_STRINGS as S } from './constants';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleLabel, simpleSelect } = menuStyles;

export default function ReportsTab({
    version,
    versions,
    handleVersionChange,
    orgs,
    selectedOrgId,
    setSelectedOrgId,
    includeStatusSheet,
    setIncludeStatusSheet,
    summaryStats,
    filteredEntries,
}) {
    const allOrgs = React.useMemo(() => {
        const seen = new Set();
        return orgs.filter((org) => {
            if (seen.has(org.id)) return false;
            seen.add(org.id);
            return true;
        });
    }, [orgs]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {!version && (
                <InfoBox
                    type="warning"
                    title={S.noVersionSelected}
                    message={S.selectVersionToView}
                />
            )}

            {version && filteredEntries.length === 0 && (
                <EmptyState
                    icon="📄"
                    title={S.noData}
                    message={S.noMatchFilters}
                />
            )}

            <section style={{ ...menuPanelCard, borderTop: '4px solid #2196F3', backgroundColor: '#f3f6ff' }}>
                <div style={menuPanelHead}>{S.reportFilters}</div>
                <div style={menuPanelBody}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ ...simpleLabel, display: 'block', marginBottom: 8, fontWeight: 'bold' }}>{S.budgetVersion}</label>
                        <select style={simpleSelect} value={version?.id ? String(version.id) : ''} onChange={e => handleVersionChange(e.target.value)}>
                            {!version?.id && <option value="">{S.selectVersion}</option>}
                            {versions.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.year} / {v.name || `${v.round}차`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ ...simpleLabel, display: 'block', marginBottom: 8, fontWeight: 'bold' }}>{S.organization}</label>
                        <select style={simpleSelect} value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)}>
                            <option value="">{S.allOrganizations}</option>
                            {allOrgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                            <input type="checkbox" checked={includeStatusSheet} onChange={e => setIncludeStatusSheet(e.target.checked)} />
                            <span>{S.includeByOrg}</span>
                        </label>
                    </div>
                </div>
            </section>

            <section style={menuPanelCard}>
                <div style={menuPanelHead}>{S.preview}</div>
                <div style={menuPanelBody}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                        <MetricCard label="준비중(DRAFT)" value={summaryStats.statusCounts.DRAFT} bg="#ffebee" color="#c62828" />
                        <MetricCard label="제출대기(PENDING)" value={summaryStats.statusCounts.PENDING} bg="#fff3e0" color="#e65100" />
                        <MetricCard label="검토중(REVIEWING)" value={summaryStats.statusCounts.REVIEWING} bg="#e3f2fd" color="#0d47a1" />
                        <MetricCard label="확정(FINALIZED)" value={summaryStats.statusCounts.FINALIZED} bg="#e8f5e9" color="#1b5e20" />
                    </div>
                </div>
            </section>
        </div>
    );
}

function MetricCard({ label, value, bg, color }) {
    return (
        <div style={{ padding: 12, backgroundColor: bg, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color, marginBottom: 4, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
        </div>
    );
}
