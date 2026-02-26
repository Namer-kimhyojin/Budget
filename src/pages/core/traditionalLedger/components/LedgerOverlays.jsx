import { useEffect } from 'react';
import RoundSelectModalPortal from './RoundSelectModalPortal';
import WorkflowConfirmModalPortal from './WorkflowConfirmModalPortal';
import LogPopoverPortal from './LogPopoverPortal';
import MokActionPopover from './MokActionPopover';
import HierarchyActionPopover from './HierarchyActionPopover';
import QuickAddModal from './QuickAddModal';
import HierarchyDeleteModal from './HierarchyDeleteModal';
import CommentSidePanels from './CommentSidePanels';
import SupportingDocsModal from './SupportingDocsModal';
import ToastViewport from './ToastViewport';

export default function LedgerOverlays({
  isRoundSelectModalOpen,
  roundSelectZIndex,
  inputAvailableVersions,
  versionRelatedInfo,
  modalVersionId,
  setModalVersionId,
  modalDeptId,
  setModalDeptId,
  isAdminUser,
  selectableDepartments,
  modalTeamId,
  setModalTeamId,
  modalSelectableTeams,
  setIsRoundSelectModalOpen,
  applyRoundSelection,
  wfModal,
  workflowModalZIndex,
  setWfModal,
  statusLabel,
  deptStatus,
  version,
  executeWorkflow,
  openLogEntry,
  logAnchor,
  logPopoverRef,
  logPopoverZIndex,
  formatLogDateTime,
  openLogGroupItems,
  openLogEntryRecent,
  openLogEntryLogs,
  closeLogPopover,
  openEntryHistoryLog,
  openMokActionEntryId,
  mokActionAnchor,
  mokActionPopoverRef,
  actionPopoverZIndex,
  canEditEntry,
  closeMokAction,
  addDetailRow,
  addingEntryId,
  isVersionEditable,
  deleteEntry,
  handleToggleCommentEntry,
  openHierarchyActionId,
  hierarchyActionAnchor,
  hierarchyActionPopoverRef,
  isHierarchyAddMenuOpen,
  openHierarchyParentSubject,
  hierarchyStepOptions,
  hierarchySelectedGwanId,
  hierarchySelectedHangId,
  hierarchySelectedMokId,
  usedMokIdsInScope,
  hierarchyAddLoading,
  closeHierarchyAction,
  handleToggleHierarchyAddMenu,
  handleDeleteHierarchySubject,
  handleSelectHierarchyGwan,
  handleSelectHierarchyHang,
  handleSelectHierarchyMok,
  addEntryFromHierarchyMenu,
  hierarchyCommentData,
  hierarchyDeleteTarget,
  hierarchyDeleteLinkedEntries,
  confirmDeleteHierarchySubject,
  closeHierarchyDeleteModal,
  supportingDocsTarget,
  closeSupportingDocsModal,
  handleOpenSupportingDocs,
  leafSubjectIds,
  isAddOpen,
  subjects,
  entries,
  projects,
  projectId,
  selectedScopeOrgId,
  viewType,
  authAxios,
  versionLockMessage,
  nestedOverlayZIndex,
  setIsAddOpen,
  onRefresh,
  onRefreshProjects,
  onRefreshSubjects,
  user,
  activeEntries,
  commentEntryId,
  commentSubjectTarget,
  commentPanelZIndex,
  setCommentEntryId,
  setCommentSubjectTarget,
  onCommentMutation,
  toastItems,
  toastZIndex,
  modalApi,
}) {
  // 항목 추가 모달이 열릴 때 subjects를 최신 상태로 갱신
  useEffect(() => {
    if (isAddOpen) onRefreshSubjects?.();
  }, [isAddOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <RoundSelectModalPortal
        isOpen={isRoundSelectModalOpen}
        zIndex={roundSelectZIndex}
        inputAvailableVersions={inputAvailableVersions}
        versionRelatedInfo={versionRelatedInfo}
        modalVersionId={modalVersionId}
        onVersionChange={setModalVersionId}
        modalDeptId={modalDeptId}
        onDeptChange={setModalDeptId}
        isAdminUser={isAdminUser}
        selectableDepartments={selectableDepartments}
        modalTeamId={modalTeamId}
        onTeamChange={setModalTeamId}
        modalSelectableTeams={modalSelectableTeams}
        onClose={() => setIsRoundSelectModalOpen(false)}
        onApply={applyRoundSelection}
      />

      <WorkflowConfirmModalPortal
        wfModal={wfModal}
        workflowModalZIndex={workflowModalZIndex}
        setWfModal={setWfModal}
        statusLabel={statusLabel}
        deptStatus={deptStatus}
        version={version}
        executeWorkflow={executeWorkflow}
      />

      <LogPopoverPortal
        openLogEntry={openLogEntry}
        logAnchor={logAnchor}
        logPopoverRef={logPopoverRef}
        logPopoverZIndex={logPopoverZIndex}
        statusLabel={statusLabel}
        formatLogDateTime={formatLogDateTime}
        openLogGroupItems={openLogGroupItems}
        openLogEntryRecent={openLogEntryRecent}
        openLogEntryLogs={openLogEntryLogs}
        closeLogPopover={closeLogPopover}
        openEntryHistoryLog={openEntryHistoryLog}
      />

      <MokActionPopover
        openMokActionEntryId={openMokActionEntryId}
        mokActionAnchor={mokActionAnchor}
        mokActionPopoverRef={mokActionPopoverRef}
        actionPopoverZIndex={actionPopoverZIndex}
        canEditEntry={canEditEntry}
        closeMokAction={closeMokAction}
        addDetailRow={addDetailRow}
        addingEntryId={addingEntryId}
        isVersionEditable={isVersionEditable}
        deleteEntry={deleteEntry}
        onToggleCommentEntry={handleToggleCommentEntry}
      />

      <HierarchyActionPopover
        openHierarchyActionId={openHierarchyActionId}
        hierarchyActionAnchor={hierarchyActionAnchor}
        hierarchyActionPopoverRef={hierarchyActionPopoverRef}
        actionPopoverZIndex={actionPopoverZIndex}
        isVersionEditable={isVersionEditable}
        isHierarchyAddMenuOpen={isHierarchyAddMenuOpen}
        openHierarchyParentSubject={openHierarchyParentSubject}
        leafSubjectIds={leafSubjectIds}
        hierarchyStepOptions={hierarchyStepOptions}
        hierarchySelectedGwanId={hierarchySelectedGwanId}
        hierarchySelectedHangId={hierarchySelectedHangId}
        hierarchySelectedMokId={hierarchySelectedMokId}
        usedMokIdsInScope={usedMokIdsInScope}
        hierarchyAddLoading={hierarchyAddLoading}
        onToggleAddMenu={handleToggleHierarchyAddMenu}
        onDeleteSubject={handleDeleteHierarchySubject}
        onSelectGwan={handleSelectHierarchyGwan}
        onSelectHang={handleSelectHierarchyHang}
        onSelectMok={handleSelectHierarchyMok}
        onAddSelected={addEntryFromHierarchyMenu}
        hierarchyCommentData={hierarchyCommentData}
        setCommentSubjectTarget={setCommentSubjectTarget}
        closeHierarchyAction={closeHierarchyAction}
        onOpenSupportingDocs={handleOpenSupportingDocs}
      />

      <SupportingDocsModal
        target={supportingDocsTarget}
        onClose={closeSupportingDocsModal}
        authAxios={authAxios}
        version={version}
        orgId={selectedScopeOrgId}
        projectId={projectId}
        zIndex={nestedOverlayZIndex}
        modalApi={modalApi}
      />

      {isAddOpen && (
        <QuickAddModal
          subjects={subjects}
          entries={entries}
          projects={projects}
          orgId={selectedScopeOrgId}
          year={version?.year}
          viewType={viewType}
          authAxios={authAxios}
          version={version}
          isVersionEditable={isVersionEditable}
          versionLockMessage={versionLockMessage}
          overlayZIndex={nestedOverlayZIndex}
          leafSubjectIds={leafSubjectIds}
          onClose={() => setIsAddOpen(false)}
          onRefresh={onRefresh}
          onRefreshProjects={onRefreshProjects}
          onRefreshSubjects={onRefreshSubjects}
          modalApi={modalApi}
        />
      )}

      <HierarchyDeleteModal
        targetSubject={hierarchyDeleteTarget}
        linkedEntries={hierarchyDeleteLinkedEntries}
        onClose={closeHierarchyDeleteModal}
        onConfirm={confirmDeleteHierarchySubject}
        overlayZIndex={nestedOverlayZIndex}
      />

      <CommentSidePanels
        authAxios={authAxios}
        entries={entries}
        activeEntries={activeEntries}
        versionId={version?.id}
        user={user}
        commentEntryId={commentEntryId}
        commentSubjectTarget={commentSubjectTarget}
        commentPanelZIndex={commentPanelZIndex}
        onCloseEntry={() => setCommentEntryId(null)}
        onCloseSubject={() => setCommentSubjectTarget(null)}
        onRefresh={onRefresh}
        onCommentMutation={onCommentMutation}
        modalApi={modalApi}
      />

      <ToastViewport items={toastItems} zIndex={toastZIndex} />
    </>
  );
}
