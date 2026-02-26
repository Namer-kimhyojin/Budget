import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MokActionTrigger from "../components/MokActionTrigger";
import { useExcelExport } from "./useExcelExport";
import { useWorkflow } from "./useWorkflow";
import { useLedgerEntryActions } from "./useLedgerEntryActions";
import { useLedgerLogPanel } from "./useLedgerLogPanel";
import { useTraditionalLedgerDerivedData } from "./useTraditionalLedgerDerivedData";
import { useLedgerEntryLogs } from "./useLedgerEntryLogs";
import { useRoundSelectionState } from "./useRoundSelectionState";
import { useLedgerUiEffects } from "./useLedgerUiEffects";
import { useLedgerPopoverState } from "./useLedgerPopoverState";
import { useToastQueue } from "./useToastQueue";
import { useCommentAndDocsSummary } from "./useCommentAndDocsSummary";
import { useTraditionalLedgerPageState } from "./useTraditionalLedgerPageState";
import {
  formatLogDateTime,
  isRejectLog,
  versionRelatedInfo,
} from "../helpers/ledgerViewUtils";
import {
  buildLedgerHeaderProps,
  buildLedgerOverlayProps,
  buildLedgerSheetProps,
  buildLedgerTabsProps,
} from "../helpers/ledgerViewPropBuilders";
import { buildLedgerLayerZIndex } from "../helpers/ledgerLayerZIndex";
import { ledgerLayout, mokActionPopover, logPopoverCard } from "../styles";

export function useTraditionalLedgerController({
  authAxios,
  entries,
  subjects,
  projects = [],
  orgs,
  onRefresh,
  onRefreshSubjects,
  onRefreshProjects,
  modalApi,
  version,
  versions,
  setVersion,
  onVersionStatusChange,
  user,
  targetDeptId,
  targetTeamId,
  focusEntryId,
  focusEntryIds,
  showCombinedTypeView = false,
  embeddedMode,
}) {
  const {
    selectedDeptId,
    setSelectedDeptId,
    selectedTeamId,
    setSelectedTeamId,
    projectId,
    setProjectId,
    viewType,
    setViewType,
    showMyEntries,
    setShowMyEntries,
    hiddenCols,
    toggleCol,
    applyColPreset,
    isAddOpen,
    setIsAddOpen,
    localDetails,
    setLocalDetails,
    addingEntryId,
    setAddingEntryId,
    deletingDetailId,
    setDeletingDetailId,
    focusDetailId,
    setFocusDetailId,
    commentEntryId,
    setCommentEntryId,
    commentSubjectTarget,
    setCommentSubjectTarget,
    commentUnresolvedLoaded,
    setCommentUnresolvedLoaded,
    unresolvedByEntryId,
    setUnresolvedByEntryId,
    unresolvedBySubjectId,
    setUnresolvedBySubjectId,
    unresolvedRootTypes,
    setUnresolvedRootTypes,
    hasConfirmedRound,
    setHasConfirmedRound,
    commentScopeOrgId,
    commentScopeOrgIds,
    modalDeptIdBridge,
    setModalDeptIdBridge,
    autoSaveTimersRef,
    autoSavePendingRef,
    autoSaveAbortRef,
    autoSaveSuccessAtRef,
    supportingDocsSubjectIds,
    setSupportingDocsSubjectIds,
  } = useTraditionalLedgerPageState({
    targetDeptId,
    targetTeamId,
    orgs,
  });
  const { toastItems, pushToast } = useToastQueue();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => !embeddedMode);
  const [isSyncRefreshing, setIsSyncRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [lastConflictAt, setLastConflictAt] = useState(null);
  const syncInFlightRef = useRef(false);

  const runRefresh = useCallback(async ({ notify = false } = {}) => {
    if (!onRefresh || syncInFlightRef.current) return false;
    syncInFlightRef.current = true;
    setIsSyncRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
      setLastSyncedAt(Date.now());
      if (notify) pushToast("최신 데이터로 동기화했습니다.", "success");
      return true;
    } catch (error) {
      console.error(error);
      if (notify) pushToast("동기화 중 오류가 발생했습니다.", "error");
      return false;
    } finally {
      syncInFlightRef.current = false;
      setIsSyncRefreshing(false);
    }
  }, [onRefresh, pushToast]);

  const handleRefreshNow = useCallback(() => {
    runRefresh({ notify: true });
  }, [runRefresh]);

  const handleDetailConflict = useCallback(() => {
    setLastConflictAt(Date.now());
  }, []);

  useEffect(() => {
    if (embeddedMode) {
      setAutoRefreshEnabled(false);
    }
  }, [embeddedMode]);

  useEffect(() => {
    if (!hasConfirmedRound) return;
    setLastSyncedAt(Date.now());
  }, [entries, hasConfirmedRound, version?.id, selectedDeptId, selectedTeamId]);

  useEffect(() => {
    if (embeddedMode || !autoRefreshEnabled || !hasConfirmedRound) return undefined;
    const timer = window.setInterval(() => {
      if (syncInFlightRef.current) return;
      if (Object.keys(autoSavePendingRef.current || {}).length > 0) return;
      runRefresh();
    }, 45000);
    return () => window.clearInterval(timer);
  }, [embeddedMode, autoRefreshEnabled, hasConfirmedRound, autoSavePendingRef, runRefresh]);

  const {
    openMokActionEntryId,
    mokActionAnchor,
    setMokActionRef,
    mokActionPopoverRef,
    closeMokAction,
    openMokAction,
    openHierarchyActionId,
    hierarchyActionAnchor,
    hierarchyActionRefs,
    hierarchyActionPopoverRef,
    isHierarchyAddMenuOpen,
    setIsHierarchyAddMenuOpen,
    hierarchySelectedGwanId,
    setHierarchySelectedGwanId,
    hierarchySelectedHangId,
    setHierarchySelectedHangId,
    hierarchySelectedMokId,
    setHierarchySelectedMokId,
    hierarchyAddLoading,
    setHierarchyAddLoading,
    hierarchyCommentData,
    closeHierarchyAction,
    openHierarchyAction,
    openLogEntry,
    logAnchor,
    logPopoverRef,
    setNewLogEntries,
    clearNewLogEntries,
    closeLogPopover,
    hierarchyDeleteTarget,
    setHierarchyDeleteTarget,
    hierarchyDeleteLinkedEntries,
    setHierarchyDeleteLinkedEntries,
    closeHierarchyDeleteModal,
    supportingDocsTarget,
    setSupportingDocsTarget,
    closeSupportingDocsModal,
  } = useLedgerPopoverState();

  const {
    roundSelectZIndex,
    workflowModalZIndex,
    actionPopoverZIndex,
    logPopoverZIndex,
    toastZIndex,
    nestedOverlayZIndex,
    commentPanelZIndex,
  } = buildLedgerLayerZIndex({
    embeddedMode,
    mokActionPopoverZIndex: mokActionPopover.zIndex,
    logPopoverCardZIndex: logPopoverCard.zIndex,
  });

  const handleToggleCommentEntry = (targetId) => {
    setCommentEntryId((prev) => (prev === targetId ? null : targetId));
  };

  const { openHierarchyCommentPanel, refreshCommentSummary } = useCommentAndDocsSummary({
    authAxios,
    hasConfirmedRound,
    versionId: version?.id,
    commentScopeOrgIds,
    commentScopeOrgId,
    projectId,
    supportingDocsTarget,
    closeHierarchyAction,
    setCommentEntryId,
    setCommentSubjectTarget,
    setUnresolvedByEntryId,
    setUnresolvedBySubjectId,
    setUnresolvedRootTypes,
    setCommentUnresolvedLoaded,
    setSupportingDocsSubjectIds,
  });

  const handleCommentMutation = () => {
    refreshCommentSummary();
    onRefresh?.();
  };

  const {
    isAdminUser,
    myOrg,
    selectableDepartments,
    selectableTeams,
    selectedScopeOrgId,
    modalSelectableTeams,
    openHierarchyParentSubject,
    usedMokIdsInScope,
    hierarchyStepOptions,
    leafSubjectIds,
    activeEntries,
    inputAvailableVersions,
    enteredCount,
    totalEditableCount,
    inputProgressRatio,
    selectedVersionPeriod,
    selectedDeptName,
    incTotal,
    expTotal,
    diffTotal,
    isBalanced,
    isVersionEditable,
    versionStatusLabel,
    versionLockMessage,
    EDIT_BLOCKED_MSG,
    statusLabel,
    deptEntries,
    deptEntryIds,
    deptStatus,
    detailToEntryId,
    detailUpdatedAtById,
    canEditEntry,
    tree,
  } = useTraditionalLedgerDerivedData({
    orgs,
    user,
    selectedDeptId,
    selectedTeamId,
    modalDeptId: modalDeptIdBridge,
    openHierarchyActionId,
    entries,
    version,
    projectId,
    subjects,
    hierarchySelectedGwanId,
    hierarchySelectedHangId,
    focusEntryId,
    focusEntryIds,
    localDetails,
    showCombinedTypeView,
    viewType,
    versions,
    projects,
    showMyEntries,
    hasConfirmedRound,
  });

  const { entryLogsById } = useLedgerEntryLogs({
    authAxios,
    deptEntryIds,
    version,
    selectedScopeOrgId,
    clearNewLogEntries,
    closeLogPopover,
    setNewLogEntries,
  });

  const {
    isRoundSelectModalOpen,
    modalVersionId,
    setModalVersionId,
    modalDeptId,
    setModalDeptId,
    modalTeamId,
    setModalTeamId,
    setIsRoundSelectModalOpen,
    openRoundSelectModal,
    applyRoundSelection,
  } = useRoundSelectionState({
    embeddedMode,
    version,
    versions,
    inputAvailableVersions,
    selectedDeptId,
    selectableDepartments,
    selectedTeamId,
    modalSelectableTeams,
    pushToast,
    setVersion,
    setSelectedDeptId,
    setSelectedTeamId,
    setProjectId,
    onRefresh,
    modalDeptIdExternal: modalDeptIdBridge,
    setModalDeptIdExternal: setModalDeptIdBridge,
    hasConfirmedRound,
    setHasConfirmedRound,
  });

  const visibleEntries = useMemo(
    () => (hasConfirmedRound ? entries : []),
    [hasConfirmedRound, entries],
  );
  const visibleActiveEntries = useMemo(
    () => (hasConfirmedRound ? activeEntries : []),
    [hasConfirmedRound, activeEntries],
  );

  useLedgerUiEffects({
    targetDeptId,
    targetTeamId,
    setSelectedDeptId,
    setSelectedTeamId,
    selectableDepartments,
    selectedDeptId,
    myOrg,
    isAdminUser,
    selectedTeamId,
    selectableTeams,
    autoSaveTimersRef,
    autoSaveAbortRef,
    focusDetailId,
    setFocusDetailId,
    entries: visibleEntries,
  });

  const {
    flushAutoSave,
    updateLocalDetail,
    addDetailRow,
    deleteDetail,
    deleteEntry,
    addEntryFromHierarchyMenu,
    handleToggleHierarchyAddMenu,
    handleDeleteHierarchySubject,
    confirmDeleteHierarchySubject,
    handleSelectHierarchyGwan,
    handleSelectHierarchyHang,
    handleSelectHierarchyMok,
    handleOpenSupportingDocs,
  } = useLedgerEntryActions({
    authAxios,
    onRefresh,
    pushToast,
    versionLockMessage,
    EDIT_BLOCKED_MSG,
    detailToEntryId,
    detailUpdatedAtById,
    isVersionEditable,
    canEditEntry,
    autoSaveAbortRef,
    autoSaveTimersRef,
    autoSavePendingRef,
    autoSaveSuccessAtRef,
    setLocalDetails,
    activeEntries: visibleActiveEntries,
    entries: visibleEntries,
    addingEntryId,
    setAddingEntryId,
    setFocusDetailId,
    deletingDetailId,
    setDeletingDetailId,
    modalApi,
    selectedScopeOrgId,
    version,
    hierarchySelectedGwanId,
    hierarchySelectedHangId,
    hierarchySelectedMokId,
    usedMokIdsInScope,
    projectId,
    setHierarchyAddLoading,
    closeHierarchyAction,
    openHierarchyParentSubject,
    setHierarchySelectedGwanId,
    setHierarchySelectedHangId,
    setHierarchySelectedMokId,
    setIsHierarchyAddMenuOpen,
    openHierarchyActionId,
    subjects,
    leafSubjectIds,
    hierarchyDeleteTarget,
    setHierarchyDeleteTarget,
    setHierarchyDeleteLinkedEntries,
    closeHierarchyDeleteModal,
    setSupportingDocsTarget,
    onDetailConflict: handleDetailConflict,
  });

  const renderMokActions = (entryId, extraProps = {}) =>
    React.createElement(MokActionTrigger, {
      entryId,
      isOpen: openMokActionEntryId === entryId,
      setActionRef: setMokActionRef,
      closeAction: closeMokAction,
      openAction: openMokAction,
      ...extraProps,
    });

  const { exportToExcel } = useExcelExport({
    orgs,
    selectedScopeOrgId,
    version,
    pEntries: deptEntries,
    subjects,
    projects,
    localDetails,
  });

  const { wfModal, setWfModal, executeWorkflow } = useWorkflow({
    isVersionEditable,
    versionLockMessage,
    selectedScopeOrgId,
    version,
    orgs,
    deptStatus,
    deptEntries,
    localDetails,
    subjects,
    authAxios,
    onRefresh,
    modalApi,
    pushToast,
  });

  const {
    openEntryHistoryLog,
    openLogGroupItems,
    openLogEntryLogs,
    openLogEntryRecent,
  } = useLedgerLogPanel({
    entryLogsById,
    setNewLogEntries,
    modalApi,
    statusLabel,
    formatLogDateTime,
    isRejectLog,
    openLogEntry,
    entries: visibleEntries,
  });

  return {
    layoutStyle: ledgerLayout,
    headerProps: buildLedgerHeaderProps({
      version,
      isVersionEditable,
      selectedDeptName,
      selectedVersionPeriod,
      embeddedMode,
      openRoundSelectModal,
      incTotal,
      expTotal,
      isBalanced,
      diffTotal,
      inputProgressRatio,
      enteredCount,
      totalEditableCount,
      onRefresh,
      modalApi,
      exportToExcel,
      pushToast,
      versionLockMessage,
      setIsAddOpen,
      versionStatusLabel,
      user,
      authAxios,
      onVersionStatusChange,
      showMyEntries,
      setShowMyEntries,
      hiddenCols,
      toggleCol,
      applyColPreset,
      showTransferColumns: String(version?.creation_mode || '').toUpperCase() === 'TRANSFER' || Boolean(version?.source_version),
      showSyncControls: !embeddedMode,
      isSyncRefreshing,
      lastSyncedAt,
      lastConflictAt,
      autoRefreshEnabled,
      setAutoRefreshEnabled,
      onRefreshNow: handleRefreshNow,
    }),
    tabsProps: buildLedgerTabsProps({
      showCombinedTypeView,
      setViewType,
      viewType,
      incTotal,
      expTotal,
    }),
    sheetProps: buildLedgerSheetProps({
      showCombinedTypeView,
      viewType,
      tree,
      version,
      isVersionEditable,
      setIsAddOpen,
      selectedScopeOrgId,
      hierarchyActionRefs,
      openHierarchyActionId,
      closeHierarchyAction,
      openHierarchyAction,
      openHierarchyCommentPanel,
      commentUnresolvedLoaded,
      unresolvedByEntryId,
      unresolvedBySubjectId,
      unresolvedRootTypes,
      handleToggleCommentEntry,
      renderMokActions,
      addDetailRow,
      deleteDetail,
      deletingDetailId,
      localDetails,
      updateLocalDetail,
      flushAutoSave,
      authAxios,
      onRefresh,
      onRefreshSubjects,
      onRefreshProjects,
      supportingDocsSubjectIds,
      subjects,
      modalApi,
      hiddenCols,
      toggleCol,
    }),
    overlayProps: buildLedgerOverlayProps({
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
      handleToggleHierarchyAddMenu,
      handleDeleteHierarchySubject,
      handleSelectHierarchyGwan,
      handleSelectHierarchyHang,
      handleSelectHierarchyMok,
      addEntryFromHierarchyMenu,
      hierarchyCommentData,
      setCommentSubjectTarget,
      onCommentMutation: handleCommentMutation,
      closeHierarchyAction,
      hierarchyDeleteTarget,
      hierarchyDeleteLinkedEntries,
      closeHierarchyDeleteModal,
      confirmDeleteHierarchySubject,
      isAddOpen,
      subjects,
      entries: visibleEntries,
      projects,
      orgs,
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
      activeEntries: visibleActiveEntries,
      commentEntryId,
      commentSubjectTarget,
      commentPanelZIndex,
      setCommentEntryId,
      handleOpenSupportingDocs,
      supportingDocsTarget,
      closeSupportingDocsModal,
      leafSubjectIds,
      toastItems,
      toastZIndex,
      modalApi,
    }),
  };
}
