/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MenuShell, InfoBox, EmptyState } from '../../shared/menuUi';
import { apiErrorMessage, noOpModal, num } from '../../shared/utils';
import ApprovalFilters from './ApprovalFilters';
import ApprovalTable from './ApprovalTable';
import WorkflowPanel from './WorkflowPanel';
import RecentWorkflowLogTable from './RecentWorkflowLogTable';
import { STATUS_LABELS, isRejectLog, safeFileName, formatLogDateTime } from './helpers';
import EntryReviewModal from './EntryReviewModal';
import { useDepartmentApprovalLogs } from './hooks/useDepartmentApprovalLogs';

import { DEPT_APPROVAL_STRINGS as S } from './constants';

const getDeptStatus = (scopeEntries) => {
  if (!scopeEntries.length) return 'DRAFT';
  const uniq = [...new Set(scopeEntries.map(e => e.status || 'DRAFT'))];
  return uniq.length === 1 ? uniq[0] : 'MIXED';
};

export default function DepartmentApprovalPage({
  menuId,
  authAxios,
  version,
  versions = [],
  setVersion,
  subjects = [],
  orgs = [],
  entries = [],
  projects = [],
  user,
  onRefreshEntries,
  modalApi,
}) {
  const modal = modalApi || noOpModal;
  const isAdmin = user?.role === 'ADMIN';
  // 역할 매핑: MANAGER = 총무팀(구 REVIEWER), STAFF = 부서 담당자(구 MANAGER/REQUESTOR)
  const isManager = user?.role === 'MANAGER' || user?.role === 'REVIEWER'; // 하위 호환
  const isReviewer = isManager; // 하위 호환 alias
  const isRequestor = user?.role === 'STAFF' || user?.role === 'REQUESTOR'; // 하위 호환
  const isVersionEditable = Boolean(version && version.status === 'PENDING');

  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState('');
  const [detailEntryIds, setDetailEntryIds] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailDraft, setDetailDraft] = useState({});
  const [busyWorkflow, setBusyWorkflow] = useState(false);
  const [busySaveAll, setBusySaveAll] = useState(false);
  const [busyAddDetail, setBusyAddDetail] = useState(false);
  const [busyDeleteDetailId, setBusyDeleteDetailId] = useState(null);
  const [workflowReasons, setWorkflowReasons] = useState({
    deptApprove: '',
    deptReject: '',
    deptReopen: '',
    entryApprove: '',
    entryReject: '',
    entryReopen: '',
    entryRecall: '',
    detailEdit: '',
  });

  const versionOptions = useMemo(
    () => [...versions].sort((a, b) => b.year - a.year || b.round - a.round),
    [versions]
  );
  const departments = useMemo(
    () => orgs.filter(org => org.org_type !== 'team' && !org.parent),
    [orgs]
  );
  const teams = useMemo(
    () => orgs.filter(org => org.org_type === 'team' || org.parent),
    [orgs]
  );
  const myOrg = useMemo(
    () => orgs.find(org => Number(org.id) === Number(user?.organization)),
    [orgs, user?.organization]
  );
  const myDeptId = useMemo(() => {
    if (!myOrg) return null;
    if (myOrg.org_type === 'team' || myOrg.parent) return Number(myOrg.parent);
    return Number(myOrg.id);
  }, [myOrg]);

  const selectableDepartments = useMemo(() => {
    if (isAdmin) return departments;
    if (!myDeptId) return [];
    // MANAGER와 STAFF 모두 자신에게 속한 부서만 조회 가능
    return departments.filter(dept => Number(dept.id) === Number(myDeptId));
  }, [departments, isAdmin, myDeptId]);

  useEffect(() => {
    if (!selectableDepartments.length) return;
    const exists = selectableDepartments.some(dept => String(dept.id) === String(selectedDeptId));
    if (!exists) setSelectedDeptId(String(selectableDepartments[0].id));
  }, [selectableDepartments, selectedDeptId]);

  const teamsOfDept = useMemo(() => {
    if (!selectedDeptId) return [];
    return teams.filter(team => Number(team.parent) === Number(selectedDeptId));
  }, [teams, selectedDeptId]);

  const selectableTeams = useMemo(() => {
    // ADMIN/MANAGER는 부서 내 모든 팀 조회 가능
    if (isAdmin || isManager) return teamsOfDept;
    if (!myOrg) return [];
    return teamsOfDept.filter(team => Number(team.id) === Number(myOrg.id));
  }, [isAdmin, isManager, teamsOfDept, myOrg]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const exists = selectableTeams.some(team => String(team.id) === String(selectedTeamId));
    if (!exists) setSelectedTeamId('');
  }, [selectedTeamId, selectableTeams]);

  useEffect(() => {
    if (isAdmin || isManager || !myOrg || selectedTeamId) return;
    if (!(myOrg.org_type === 'team' || myOrg.parent)) return;
    if (Number(myOrg.parent) !== Number(selectedDeptId)) return;
    setSelectedTeamId(String(myOrg.id));
  }, [isAdmin, isManager, myOrg, selectedDeptId, selectedTeamId]);

  useEffect(() => {
    setSelectedGroupKey('');
    setDetailEntryIds([]);
    setIsDetailModalOpen(false);
    setWorkflowReasons({
      deptApprove: '',
      deptReject: '',
      deptReopen: '',
      entryApprove: '',
      entryReject: '',
      entryReopen: '',
      entryRecall: '',
      detailEdit: '',
    });
  }, [selectedDeptId, selectedTeamId, version?.id]);

  const selectedScopeOrgIds = useMemo(() => {
    if (selectedTeamId) return [Number(selectedTeamId)];
    if (!selectedDeptId) return [];
    const deptId = Number(selectedDeptId);
    const teamIds = teams.filter(team => Number(team.parent) === deptId).map(team => Number(team.id));
    return [deptId, ...teamIds];
  }, [selectedDeptId, selectedTeamId, teams]);

  const subjectById = useMemo(() => {
    const map = {};
    subjects.forEach(subject => { map[Number(subject.id)] = subject; });
    return map;
  }, [subjects]);

  const scopeEntries = useMemo(() => entries.filter((entry) => (
    Number(entry.year) === Number(version?.year)
    && Number(entry.supplemental_round ?? 0) === Number(version?.round ?? 0)
    && selectedScopeOrgIds.includes(Number(entry.organization))
  )), [entries, version?.year, version?.round, selectedScopeOrgIds]);

  const deptStatus = useMemo(() => getDeptStatus(scopeEntries), [scopeEntries]);

  const filteredEntries = useMemo(() => {
    const byStatus = statusFilter === 'ALL'
      ? scopeEntries
      : scopeEntries.filter(entry => (entry.status || 'DRAFT') === statusFilter);
    if (!searchText.trim()) return byStatus;
    const q = searchText.trim().toLowerCase();
    return byStatus.filter(entry => (
      String(entry.id).includes(q)
      || String(entry.subject_name || '').toLowerCase().includes(q)
      || String(entry.subject_code || '').toLowerCase().includes(q)
      || String(entry.organization_name || '').toLowerCase().includes(q)
    ));
  }, [scopeEntries, statusFilter, searchText]);

  useEffect(() => {
    if (!scopeEntries.length) {
      setSelectedEntryId(null);
      setDetailDraft({});
      setIsDetailModalOpen(false);
      return;
    }
    const exists = scopeEntries.some(entry => Number(entry.id) === Number(selectedEntryId));
    if (!exists) {
      setSelectedEntryId(Number(scopeEntries[0].id));
      setDetailDraft({});
    }
  }, [scopeEntries, selectedEntryId]);

  const selectedEntry = useMemo(
    () => scopeEntries.find(entry => Number(entry.id) === Number(selectedEntryId)) || null,
    [scopeEntries, selectedEntryId]
  );
  const scopeEntryIds = useMemo(
    () => scopeEntries.map(entry => Number(entry.id)).filter(id => Number.isFinite(id)),
    [scopeEntries]
  );

  const {
    entryLogsById,
    newLogEntries,
    recentWorkflowLogs,
    submissionInfoById,
    groupedSubmissions,
    clearNewLog,
    clearNewLogsByEntryIds,
    resetLogsState,
  } = useDepartmentApprovalLogs({
    authAxios,
    scopeEntryIds,
    scopeEntries,
    filteredEntries,
    version,
  });

  useEffect(() => {
    resetLogsState();
  }, [selectedDeptId, selectedTeamId, version?.id, resetLogsState]);
  useEffect(() => {
    if (!groupedSubmissions.length) {
      setSelectedGroupKey('');
      setDetailEntryIds([]);
      setIsDetailModalOpen(false);
      return;
    }
    if (!selectedGroupKey || !groupedSubmissions.some(group => group.key === selectedGroupKey)) {
      const nextGroup = groupedSubmissions[0];
      setSelectedGroupKey(nextGroup.key);
      if (nextGroup.entryIds.length) {
        setSelectedEntryId(Number(nextGroup.entryIds[0]));
      }
    }
  }, [groupedSubmissions, selectedGroupKey]);

  const selectedSubmissionGroup = useMemo(
    () => groupedSubmissions.find(group => group.key === selectedGroupKey) || null,
    [groupedSubmissions, selectedGroupKey]
  );
  const detailModalEntries = useMemo(() => {
    if (!detailEntryIds.length) return [];
    const idSet = new Set(detailEntryIds.map(id => Number(id)));
    return scopeEntries.filter(entry => idSet.has(Number(entry.id)));
  }, [scopeEntries, detailEntryIds]);
  const detailModalPrimaryEntry = detailModalEntries[0] || null;
  const detailModalTotalAmount = useMemo(
    () => detailModalEntries.reduce((sum, entry) => sum + Number(entry.total_amount || 0), 0),
    [detailModalEntries]
  );

  useEffect(() => {
    if (!isDetailModalOpen) return;
    if (!selectedSubmissionGroup) {
      setIsDetailModalOpen(false);
      return;
    }
    if (!detailModalEntries.length) {
      setIsDetailModalOpen(false);
    }
  }, [isDetailModalOpen, selectedSubmissionGroup, detailModalEntries.length]);

  const summaryStats = useMemo(() => {
    const statusCounts = { DRAFT: 0, PENDING: 0, REVIEWING: 0, FINALIZED: 0 };
    let incomeAmount = 0;
    let expenseAmount = 0;
    scopeEntries.forEach((entry) => {
      const status = entry.status || 'DRAFT';
      if (statusCounts[status] != null) statusCounts[status] += 1;
      const amount = Number(entry.total_amount || 0);
      const subjectType = entry.subject_type || subjectById[Number(entry.subject)]?.subject_type;
      if (subjectType === 'income') incomeAmount += amount;
      else expenseAmount += amount;
    });
    return { statusCounts, totalEntries: scopeEntries.length, incomeAmount, expenseAmount, diffAmount: incomeAmount - expenseAmount };
  }, [scopeEntries, subjectById]);

  const urgentCount = summaryStats.statusCounts.PENDING + summaryStats.statusCounts.REVIEWING;

  const handleVersionChange = (versionId) => {
    if (!setVersion) return;
    const next = versionOptions.find(v => String(v.id) === String(versionId));
    if (next) setVersion(next);
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
    setSearchText('');
  };

  const setWorkflowReason = useCallback((key, value) => {
    setWorkflowReasons((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openEntryDetailModal = useCallback((target) => {
    const entryIds = Array.isArray(target?.entryIds)
      ? target.entryIds.map(id => Number(id)).filter(id => Number.isFinite(id))
      : [Number(target)].filter(id => Number.isFinite(id));
    if (!entryIds.length) return;
    if (target?.key) setSelectedGroupKey(target.key);
    setDetailEntryIds(entryIds);
    setSelectedEntryId(entryIds[0]);
    clearNewLogsByEntryIds(entryIds);
    setIsDetailModalOpen(true);
  }, [clearNewLogsByEntryIds]);

  const closeEntryDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
  }, []);

  const openEntryHistoryLog = useCallback(async (target, mode = 'change') => {
    const targetEntryIds = Array.isArray(target?.entryIds)
      ? target.entryIds.map(id => Number(id)).filter(id => Number.isFinite(id))
      : [Number(target?.id)].filter(id => Number.isFinite(id));
    const allLogs = targetEntryIds
      .flatMap(entryId => entryLogsById[entryId] || [])
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const logs = mode === 'reject' ? allLogs.filter(isRejectLog) : allLogs.filter(log => !isRejectLog(log));
    if (!logs.length) {
      await modal.alert(S.noLogsMsg);
      return;
    }
    const lines = logs.slice(0, 20).map((log, idx) => {
      const actor = log.actor_name || log.actor || 'SYSTEM';
      const from = STATUS_LABELS[log.from_status] || log.from_status || '-';
      const to = STATUS_LABELS[log.to_status] || log.to_status || '-';
      const reason = String(log.reason || '').trim();
      const base = `${idx + 1}. ${formatLogDateTime(log.created_at)} | ${actor} | ${from} -> ${to}`;
      return reason ? `${base} | ${reason}` : base;
    });
    const heading = mode === 'reject' ? S.rejectLogs : S.changeLogs;
    const moreLine = logs.length > 20 ? `\n... ${S.all} ${logs.length} ${S.totalItems}` : '';
    const title = target?.submitterId
      ? `${target.submitterName || target.submitterId} (항목 ${target.entryCount || targetEntryIds.length}건)`
      : (target?.subject_name || target?.subject_code || target?.id || '-');
    await modal.alert(`[${title}] ${heading}\n\n${lines.join('\n')}${moreLine}`);
    clearNewLogsByEntryIds(targetEntryIds);
  }, [entryLogsById, modal, clearNewLogsByEntryIds]);

  const pageState = {
    isAdmin,
    isReviewer,
    isManager,
    isRequestor,
    isVersionEditable,
    busyWorkflow,
    busySaveAll,
    busyAddDetail,
    busyDeleteDetailId,
    detailDraft,
    selectedEntry,
    deptStatus,
    scopeEntries,
    entryLogsById,
    newLogEntries,
    recentWorkflowLogs,
    summaryStats,
    subjectById,
    workflowReasons,
    submissionInfoById,
    selectedSubmissionGroup,
  };

  const pageActions = {
    setSelectedTeamId,
    setSelectedDeptId,
    setStatusFilter,
    setSearchText,
    setSelectedEntryId,
    setDetailDraft,
    setBusyWorkflow,
    setBusySaveAll,
    setBusyAddDetail,
    setBusyDeleteDetailId,
    handleVersionChange,
    resetFilters,
    setWorkflowReason,
    clearNewLog,
    clearNewLogsByEntryIds,
    openEntryHistoryLog,
    openEntryDetailModal,
    closeEntryDetailModal,
  };

  const handleExportWorkbook = async () => {
    if (!version || !selectedDeptId || !scopeEntries.length) return;
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const now = new Date();
      const dept = departments.find(d => String(d.id) === String(selectedDeptId));
      const deptName = dept?.name || selectedDeptId;
      const summaryRows = [
        { item: S.version, value: `${version.year} ${version.name || `Round ${version.round}`}` },
        { item: S.department, value: deptName },
        { item: S.generatedAt, value: now.toLocaleString('ko-KR') },
        { item: S.totalEntries, value: summaryStats.totalEntries },
        { item: S.incomeAmount, value: summaryStats.incomeAmount },
        { item: S.expenseAmount, value: summaryStats.expenseAmount },
        { item: S.diffAmount, value: summaryStats.diffAmount },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scopeEntries.map((entry, idx) => ({
        no: idx + 1,
        id: entry.id,
        status: STATUS_LABELS[entry.status] || entry.status,
        organization: entry.organization_name || entry.organization,
        subject_code: entry.subject_code || '',
        subject_name: entry.subject_name || entry.subject,
        detail_count: entry.details?.length || 0,
        amount: Number(entry.total_amount || 0),
      }))), 'Entries');
      XLSX.writeFile(wb, `${safeFileName(deptName)}_budget_${version.year}_r${version.round}_${now.toISOString().slice(0, 10)}.xlsx`);
      await modal.alert(S.exportComplete);
    } catch (e) {
      await modal.alert(apiErrorMessage(e, S.exportFail));
    }
  };

  return (
    <MenuShell
      menuId={menuId}
      user={user}
      stats={[
        { label: S.needReview, value: String(urgentCount) },
        { label: S.finalized, value: String(summaryStats.statusCounts.FINALIZED) },
        { label: S.incomeTotal, value: num(summaryStats.incomeAmount) },
        { label: S.expenseTotal, value: num(summaryStats.expenseAmount) },
      ]}
      actions={[
        { label: S.exportWorkbook, onClick: handleExportWorkbook, disabled: !selectedDeptId || !scopeEntries.length },
      ]}
    >
      {!version && <InfoBox type='warning' title={S.noVersionSelected} message={S.selectVersionMsg} />}

      <ApprovalFilters
        version={version}
        versionOptions={versionOptions}
        selectableDepartments={selectableDepartments}
        selectableTeams={selectableTeams}
        selectedDeptId={selectedDeptId}
        selectedTeamId={selectedTeamId}
        statusFilter={statusFilter}
        searchText={searchText}
        canChangeDept={isAdmin}
        onChange={pageActions}
      />

      {!selectedDeptId ? (
        <EmptyState icon='!' title={S.selectDeptTitle} message={S.selectDeptMsg} />
      ) : (
        <>
          <WorkflowPanel
            pageState={pageState}
            pageActions={pageActions}
            version={version}
            selectedDeptId={selectedDeptId}
            selectedTeamId={selectedTeamId}
            authAxios={authAxios}
            modal={modal}
            onRefreshEntries={onRefreshEntries}
          />

          <section style={{ display: 'grid', gap: 12 }}>
            <ApprovalTable
              groups={groupedSubmissions}
              selectedGroupKey={selectedGroupKey}
              onSelectGroup={setSelectedGroupKey}
              onOpenLog={openEntryHistoryLog}
              onOpenDetail={openEntryDetailModal}
            />
          </section>

          <EntryReviewModal
            isOpen={isDetailModalOpen}
            selectedSubmissionGroup={selectedSubmissionGroup}
            detailModalPrimaryEntry={detailModalPrimaryEntry}
            detailModalTotalAmount={detailModalTotalAmount}
            detailEntryIds={detailEntryIds}
            onClose={closeEntryDetailModal}
            authAxios={authAxios}
            entries={entries}
            subjects={subjects}
            orgs={orgs}
            projects={projects}
            onRefreshEntries={onRefreshEntries}
            modal={modal}
            version={version}
            versions={versions}
            setVersion={setVersion}
            user={user}
            selectedDeptId={selectedDeptId}
            selectedTeamId={selectedTeamId}
          />

          <RecentWorkflowLogTable logs={recentWorkflowLogs} />
        </>
      )}
    </MenuShell>
  );
}
