
import React from 'react';
import { menuStyles, StatusBadge, EmptyState } from '../../shared/menuUi';
import { num } from '../../shared/utils';
import { HQ_REVIEW_STRINGS as S } from './constants';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleTable, simpleTh, simpleTd, simpleSelect } = menuStyles;

export default function ApprovalTab({
    version,
    versions,
    handleVersionChange,
    selectedDeptId,
    setSelectedDeptId,
    departments,
    departmentsSummary,
    filteredEntries,
    canManage,
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section style={{ ...menuPanelCard, minHeight: 'auto' }}>
                <div style={{ ...menuPanelBody, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <label style={{ fontSize: 13, color: '#64748b', fontWeight: 700 }}>{S.budgetVersion}</label>
                        <select
                            style={{ ...simpleSelect, minWidth: 220, fontWeight: 600 }}
                            aria-label={S.budgetVersion}
                            value={version?.id ? String(version.id) : ''}
                            onChange={(e) => handleVersionChange(e.target.value)}
                        >
                            {!version?.id && <option value="">{S.selectVersion}</option>}
                            {versions.map(v => (
                                <option key={v.id} value={v.id}>
                                    {v.year} / {v.name || `${v.round}차`}
                                </option>
                            ))}
                        </select>
                        <select
                            style={{ ...simpleSelect, minWidth: 220 }}
                            value={selectedDeptId}
                            onChange={(e) => setSelectedDeptId(e.target.value)}
                        >
                            <option value="">{S.allDepartments}</option>
                            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            {!canManage && (
                <section style={{ ...menuPanelCard, borderLeft: '4px solid #ff9800', backgroundColor: '#fff3e0' }}>
                    <div style={menuPanelHead}>{S.permissionTitle}</div>
                    <div style={menuPanelBody}>
                        <p>{S.adminOnlyNotice}</p>
                    </div>
                </section>
            )}

            <section style={menuPanelCard}>
                <div style={menuPanelHead}>{S.deptProgress}</div>
                <div style={menuPanelBody}>
                    {departmentsSummary.length === 0 ? (
                        <EmptyState icon="🏢" title={S.noDepartments} message={S.noDeptSummary} />
                    ) : (
                        <table style={simpleTable}>
                            <thead>
                                <tr>
                                    <th style={simpleTh}>{S.department}</th>
                                    <th style={simpleTh}>{S.reviewing}</th>
                                    <th style={simpleTh}>{S.finalized}</th>
                                    <th style={simpleTh}>{S.totalEntries}</th>
                                    <th style={simpleTh}>{S.amount}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departmentsSummary.map((dept) => (
                                    <tr key={dept.id} style={selectedDeptId === String(dept.id) ? { backgroundColor: '#f0f7ff' } : {}}>
                                        <td style={simpleTd}>{dept.name}</td>
                                        <td style={simpleTd}>{dept.reviewing}</td>
                                        <td style={simpleTd}>{dept.finalized}</td>
                                        <td style={simpleTd}>{dept.total}</td>
                                        <td style={simpleTd}>{num(dept.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </section>

            <section style={menuPanelCard}>
                <div style={menuPanelHead}>{S.reviewFinalizeItems}</div>
                <div style={menuPanelBody}>
                    <table style={simpleTable}>
                        <thead>
                            <tr>
                                <th style={simpleTh}>ID</th>
                                <th style={simpleTh}>{S.department}</th>
                                <th style={simpleTh}>{S.subject}</th>
                                <th style={simpleTh}>{S.status}</th>
                                <th style={simpleTh}>{S.amount}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries
                                .filter(entry => entry.status === 'REVIEWING' || entry.status === 'FINALIZED')
                                .slice(0, 300)
                                .map((entry) => (
                                    <tr key={entry.id} style={entry.status === 'FINALIZED' ? { backgroundColor: '#f1f8e9' } : {}}>
                                        <td style={simpleTd}>{entry.id}</td>
                                        <td style={simpleTd}>{entry.organization_name || entry.organization}</td>
                                        <td style={simpleTd}>{entry.subject_name || entry.subject_code || `#${entry.subject}`}</td>
                                        <td style={simpleTd}><StatusBadge status={entry.status} /></td>
                                        <td style={simpleTd}>{num(entry.total_amount || 0)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
