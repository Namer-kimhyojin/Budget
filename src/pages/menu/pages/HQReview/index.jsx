
import React, { useEffect, useMemo, useState } from 'react';
import { MenuShell, menuStyles } from '../../shared/menuUi';
import { apiErrorMessage } from '../../shared/utils';
import { ENTRY_STATUS_LABELS } from '../../config';
import ApprovalTab from './ApprovalTab';
import ReportsTab from './ReportsTab';
import { HQ_REVIEW_STRINGS as S } from './constants';

const { menuPanelCard, menuPanelHead, menuPanelBody, menuGhostBtn } = menuStyles;

const REPORT_TYPES = [
    { id: 'summary', label: S.summary },
    { id: 'details', label: S.details },
    { id: 'by_dept', label: S.byDept },
];

const VALID_TABS = ['approval', 'reports'];

export default function HQReviewPage({
    menuId,
    authAxios,
    version,
    versions = [],
    setVersion,
    orgs = [],
    entries = [],
    user,
    onRefreshEntries,
    modalApi,
    initialUrlParams = {},
}) {
    // 총무팀(MANAGER, 구 REVIEWER)도 확정 권한 보유, ADMIN은 모든 권한
    const isAdmin = user?.role === 'ADMIN';
    const isManager = user?.role === 'MANAGER' || user?.role === 'REVIEWER'; // 하위 호환
    const canManage = isAdmin || isManager;
    const [activeTab, setActiveTab] = useState(() => {
        const t = initialUrlParams.tab;
        return VALID_TABS.includes(t) ? t : 'approval';
    });
    const [busy, setBusy] = useState(false);

    // activeTab 변경 → URL 쿼리 파라미터 동기화
    useEffect(() => {
        const next = activeTab === 'approval' ? '/hq-review' : `/hq-review?tab=${activeTab}`;
        const current = window.location.pathname.replace(/\/$/, '') + window.location.search;
        if (current !== next) {
            window.history.pushState({}, '', next);
        }
    }, [activeTab]);

    const [selectedDeptId, setSelectedDeptId] = useState('');

    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [includeStatusSheet, setIncludeStatusSheet] = useState(true);

    const versionOptions = useMemo(
        () => [...versions].sort((a, b) => b.year - a.year || b.round - a.round),
        [versions]
    );

    const handleVersionChange = (versionId) => {
        if (!setVersion) return;
        const next = versionOptions.find(v => String(v.id) === String(versionId));
        if (!next) return;
        setVersion(next);
    };

    const departments = useMemo(
        () => orgs.filter(o => o.org_type !== 'team' && !o.parent),
        [orgs]
    );

    const approvalEntries = useMemo(() => {
        if (!selectedDeptId) return entries;
        const deptId = Number(selectedDeptId);
        const teamIds = orgs.filter(org => Number(org.parent) === deptId).map(org => Number(org.id));
        const scopeIds = [deptId, ...teamIds];
        return entries.filter(entry => scopeIds.includes(Number(entry.organization)));
    }, [entries, selectedDeptId, orgs]);

    const approvalCounts = useMemo(() => ({
        reviewing: approvalEntries.filter(entry => entry.status === 'REVIEWING').length,
        finalized: approvalEntries.filter(entry => entry.status === 'FINALIZED').length,
        total: approvalEntries.length,
    }), [approvalEntries]);

    const departmentsSummary = useMemo(() => {
        const summary = {};
        entries.forEach((entry) => {
            const dept = departments.find(d => Number(d.id) === Number(entry.organization))
                || departments.find(d => Number(d.id) === Number(orgs.find(o => Number(o.id) === Number(entry.organization))?.parent));
            const key = dept?.id;
            if (!key) return;
            if (!summary[key]) {
                summary[key] = {
                    id: dept.id,
                    name: dept.name,
                    total: 0,
                    reviewing: 0,
                    finalized: 0,
                    amount: 0,
                };
            }
            summary[key].total += 1;
            if (entry.status === 'REVIEWING') summary[key].reviewing += 1;
            if (entry.status === 'FINALIZED') summary[key].finalized += 1;
            summary[key].amount += Number(entry.total_amount || 0);
        });
        return Object.values(summary).sort((a, b) => a.name.localeCompare(b.name));
    }, [entries, departments, orgs]);

    const runWorkflow = async (action, targetDeptId = null) => {
        if (!version || !canManage) return;
        const targets = targetDeptId ? [Number(targetDeptId)] : departments.map(d => Number(d.id));
        if (!targets.length) return;

        const label = action === 'approve' ? S.approveAction : S.reopenAction;
        const ok = await modalApi.confirm(S.confirmWorkflow(label, targets.length));
        if (!ok) return;

        const reason = action === 'reopen'
            ? (window.prompt(S.reasonLabel, S.defaultReopenReason) || '')
            : '';

        setBusy(true);
        try {
            let successCount = 0;
            for (const deptId of targets) {
                const payload = {
                    action,
                    org_id: deptId,
                    year: version.year,
                    round: version.round,
                };
                if (action === 'reopen') payload.to_status = 'DRAFT';
                if (reason) payload.reason = reason;
                await authAxios.post('/api/entries/workflow/', payload);
                successCount += 1;
            }
            await onRefreshEntries?.();
            await modalApi.alert(S.processSuccess(successCount));
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, S.processFail));
        } finally {
            setBusy(false);
        }
    };

    const handleFinalClose = async () => {
        if (!version || !canManage) return;
        const notFinalizedCount = entries.filter(e => e.status !== 'FINALIZED').length;
        const ok = await modalApi.confirm(S.confirmFinalClose(notFinalizedCount));
        if (!ok) return;

        setBusy(true);
        try {
            await authAxios.post(`/api/versions/${version.id}/close/`);
            await modalApi.alert(S.versionClosed);
            window.location.reload();
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, S.finalCloseFail));
        } finally {
            setBusy(false);
        }
    };

    const exportApprovalExcel = async (reportType) => {
        if (!version) { await modalApi.alert(S.noVersionSelected); return; }
        if (!entries.length) { await modalApi.alert(S.noDataToExport); return; }

        try {
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();
            const now = new Date();
            let rows = [];

            if (reportType === 'summary') {
                rows = departmentsSummary.map((dept, idx) => ({
                    no: idx + 1,
                    [S.department]: dept.name,
                    [S.reviewing]: dept.reviewing,
                    [S.finalized]: dept.finalized,
                    [S.totalEntries]: dept.total,
                    [S.amount]: dept.amount,
                }));
            } else if (reportType === 'by_dept') {
                rows = departmentsSummary.map((dept) => ({
                    [S.department]: dept.name,
                    ['진행률(%)']: dept.total ? Math.round((dept.finalized / dept.total) * 100) : 0,
                    [S.amount]: dept.amount,
                }));
            } else {
                rows = entries.map((entry, idx) => ({
                    no: idx + 1,
                    id: entry.id,
                    [S.organization]: entry.organization_name || entry.organization,
                    [S.subject]: entry.subject_name || entry.subject_code || `#${entry.subject}`,
                    [S.status]: entry.status,
                    [S.amount]: Number(entry.total_amount || 0),
                }));
            }

            const sheetName = REPORT_TYPES.find(r => r.id === reportType)?.label || reportType;
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheetName);
            XLSX.writeFile(wb, `${reportType}_${version.year}_r${version.round}_${now.toISOString().slice(0, 10)}.xlsx`);
            await modalApi.alert(S.downloadComplete(sheetName));
        } catch {
            await modalApi.alert(S.exportFail);
        }
    };


    // --- Reports Logic ---
    const reportFilteredEntries = useMemo(() => {
        if (!selectedOrgId) return entries;
        return entries.filter(entry => Number(entry.organization) === Number(selectedOrgId));
    }, [entries, selectedOrgId]);

    const reportStats = useMemo(() => {
        const statusCounts = { DRAFT: 0, PENDING: 0, REVIEWING: 0, FINALIZED: 0 };
        let totalAmount = 0;
        reportFilteredEntries.forEach((entry) => {
            if (statusCounts[entry.status] != null) statusCounts[entry.status] += 1;
            totalAmount += Number(entry.total_amount || 0);
        });
        return { statusCounts, totalAmount };
    }, [reportFilteredEntries]);

    const exportReportExcel = async () => {
        if (!version) { await modalApi.alert(S.noVersionSelected); return; }
        if (!reportFilteredEntries.length) { await modalApi.alert(S.noDataToExport); return; }

        try {
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();
            const now = new Date();
            const selectedOrgName = selectedOrgId
                ? (orgs.find(org => Number(org.id) === Number(selectedOrgId))?.name || selectedOrgId)
                : S.excelAll;

            const metaRows = [
                { [S.subject]: S.excelGeneratedAt, [S.amount]: now.toLocaleString() },
                { [S.subject]: S.excelGeneratedBy, [S.amount]: user?.username || '-' },
                { [S.subject]: S.excelBudgetVersion, [S.amount]: `${version.year} ${version.name}` },
                { [S.subject]: S.excelOrganization, [S.amount]: selectedOrgName },
                { [S.subject]: S.excelRows, [S.amount]: reportFilteredEntries.length },
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metaRows), S.excelMeta);

            const detailRows = reportFilteredEntries.map((entry, idx) => ({
                no: idx + 1,
                [S.version]: entry.year,
                ['추경차수']: entry.supplemental_round,
                [S.organization]: entry.organization_name || entry.organization,
                ['수탁사업']: entry.entrusted_project_name || '-',
                ['과목코드']: entry.subject_code || '',
                [S.subject]: entry.subject_name || entry.subject,
                [S.status]: ENTRY_STATUS_LABELS[entry.status] || entry.status,
                [S.amount]: Number(entry.total_amount || 0),
                ['집행액']: Number(entry.executed_total || 0),
                ['잔액']: Number(entry.remaining_amount || 0),
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), S.excelDetails);

            const summaryRows = Object.entries(reportStats.statusCounts).map(([status, count]) => ({
                [S.status]: status,
                ['표시명']: ENTRY_STATUS_LABELS[status] || status,
                [S.excelRows]: count,
            }));
            summaryRows.push({ [S.status]: S.excelTotal, ['표시명']: S.excelTotal, [S.excelRows]: reportFilteredEntries.length });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), S.excelSummary);

            if (includeStatusSheet) {
                const byOrg = {};
                reportFilteredEntries.forEach((entry) => {
                    const key = entry.organization_name || String(entry.organization);
                    if (!byOrg[key]) byOrg[key] = { [S.organization]: key, [S.excelRows]: 0, [S.amount]: 0 };
                    byOrg[key][S.excelRows] += 1;
                    byOrg[key][S.amount] += Number(entry.total_amount || 0);
                });
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.values(byOrg)), S.excelByOrg);
            }

            const fileName = `budget_report_${version.year}_r${version.round}_${now.toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, fileName);
            await modalApi.alert(S.downloadComplete(S.excelReport));
        } catch {
            await modalApi.alert(S.exportFail);
        }
    };


    // --- Shell Actions ---
    const getActions = () => {
        if (activeTab === 'approval') {
            return [
                {
                    label: S.approveSelected,
                    onClick: () => selectedDeptId ? runWorkflow('approve', selectedDeptId) : modalApi.alert(S.selectDeptMsg),
                    disabled: busy || !canManage || !selectedDeptId,
                    style: { backgroundColor: '#4CAF50', color: 'white' }
                },
                {
                    label: S.approveAll,
                    onClick: () => runWorkflow('approve'),
                    disabled: busy || !canManage || approvalCounts.total !== approvalCounts.reviewing + approvalCounts.finalized,
                },
                {
                    label: S.reopenSelected,
                    onClick: () => runWorkflow('reopen', selectedDeptId),
                    disabled: busy || !canManage || !selectedDeptId,
                }
            ];
        } else {
            return [
                { label: S.exportReport, onClick: exportReportExcel }
            ];
        }
    };

    const currentStats = activeTab === 'approval'
        ? [
            { label: S.reviewing, value: `${approvalCounts.reviewing}` },
            { label: S.finalized, value: `${approvalCounts.finalized}` },
            { label: S.totalEntries, value: `${approvalCounts.total}` },
        ]
        : [
            { label: S.rows, value: `${reportFilteredEntries.length}` },
            { label: S.totalAmount, value: `${Math.round(reportStats.totalAmount)}` },
            { label: S.version, value: version ? `${version.year} (${version.round})` : '-' },
        ];

    return (
        <MenuShell
            menuId={menuId}
            user={user}
            actions={getActions()}
            stats={currentStats}
            tabs={[
                { id: 'approval', label: S.tabApproval },
                { id: 'reports', label: S.tabReports },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {activeTab === 'approval' ? (
                <>
                    <ApprovalTab
                        version={version}
                        versions={versions}
                        handleVersionChange={handleVersionChange}
                        selectedDeptId={selectedDeptId}
                        setSelectedDeptId={setSelectedDeptId}
                        departments={departments}
                        departmentsSummary={departmentsSummary}
                        filteredEntries={approvalEntries}
                        user={user}
                        canManage={canManage}
                    />
                    {canManage && (
                        <section style={{ ...menuPanelCard, borderTop: '4px solid #3b82f6', marginTop: 24 }}>
                            <div style={menuPanelHead}>{S.adminControls}</div>
                            <div style={menuPanelBody}>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <button
                                        onClick={handleFinalClose}
                                        disabled={busy || !version}
                                        style={{ ...menuGhostBtn, backgroundColor: '#1e293b', color: '#fff', padding: '10px 16px' }}
                                    >
                                        {S.finalClose}
                                    </button>
                                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                        {REPORT_TYPES.map((rpt) => (
                                            <button
                                                key={rpt.id}
                                                onClick={() => exportApprovalExcel(rpt.id)}
                                                style={{ ...menuGhostBtn, fontSize: 13, padding: '8px 12px' }}
                                            >
                                                {S.exportPrefix}{rpt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </>
            ) : (
                <ReportsTab
                    version={version}
                    versions={versions}
                    handleVersionChange={handleVersionChange}
                    orgs={orgs}
                    selectedOrgId={selectedOrgId}
                    setSelectedOrgId={setSelectedOrgId}
                    includeStatusSheet={includeStatusSheet}
                    setIncludeStatusSheet={setIncludeStatusSheet}
                    summaryStats={reportStats}
                    filteredEntries={reportFilteredEntries}
                />
            )}
        </MenuShell>
    );
}
