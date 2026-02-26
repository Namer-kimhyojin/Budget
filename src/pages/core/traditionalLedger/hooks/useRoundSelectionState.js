import { useCallback, useEffect, useRef, useState } from "react";

export function useRoundSelectionState({
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
  modalDeptIdExternal,
  setModalDeptIdExternal,
  hasConfirmedRound = false,
  setHasConfirmedRound,
}) {
  const [isRoundSelectModalOpen, setIsRoundSelectModalOpen] = useState(false);
  const [modalVersionId, setModalVersionId] = useState("");
  const [internalModalDeptId, setInternalModalDeptId] = useState("");
  const [modalTeamId, setModalTeamId] = useState("");
  const initialVersionGuideRef = useRef(false);
  const modalDeptId = modalDeptIdExternal ?? internalModalDeptId;
  const setModalDeptId = setModalDeptIdExternal ?? setInternalModalDeptId;

  useEffect(() => {
    if (embeddedMode) return;
    if (initialVersionGuideRef.current) return;
    if (!versions.length) return;
    const firstVersionId = String(
      version?.id || inputAvailableVersions[0]?.id || versions[0]?.id || "",
    );
    const firstDeptId = String(
      selectedDeptId || selectableDepartments[0]?.id || "",
    );
    queueMicrotask(() => {
      setModalVersionId(firstVersionId);
      setModalDeptId(firstDeptId);
      setModalTeamId(selectedTeamId ? String(selectedTeamId) : "");
      setIsRoundSelectModalOpen(true);
    });
    initialVersionGuideRef.current = true;
  }, [
    versions,
    version?.id,
    inputAvailableVersions,
    selectedDeptId,
    selectableDepartments,
    selectedTeamId,
    embeddedMode,
    setModalDeptId,
  ]);

  useEffect(() => {
    if (!modalTeamId) return;
    const exists = modalSelectableTeams.some(
      (team) => Number(team.id) === Number(modalTeamId),
    );
    if (!exists) {
      queueMicrotask(() => setModalTeamId(""));
    }
  }, [modalTeamId, modalSelectableTeams]);

  const openRoundSelectModal = useCallback(() => {
    if (embeddedMode) return;
    setModalVersionId(
      String(
        version?.id || inputAvailableVersions[0]?.id || versions[0]?.id || "",
      ),
    );
    setModalDeptId(
      String(selectedDeptId || selectableDepartments[0]?.id || ""),
    );
    setModalTeamId(selectedTeamId ? String(selectedTeamId) : "");
    setIsRoundSelectModalOpen(true);
  }, [
    version?.id,
    inputAvailableVersions,
    versions,
    selectedDeptId,
    selectableDepartments,
    selectedTeamId,
    embeddedMode,
    setModalDeptId,
  ]);

  const applyRoundSelection = useCallback(async () => {
    if (!modalVersionId) {
      pushToast("입력 회차를 선택해 주세요.", "error");
      return;
    }
    const nextVersion = versions.find(
      (item) => Number(item.id) === Number(modalVersionId),
    );
    if (nextVersion) setVersion(nextVersion);

    const nextDeptId = Number(modalDeptId || selectableDepartments[0]?.id || 0);
    if (nextDeptId) setSelectedDeptId(nextDeptId);
    setSelectedTeamId(modalTeamId ? Number(modalTeamId) : null);
    setProjectId(null);
    if (typeof setHasConfirmedRound === "function") {
      setHasConfirmedRound(true);
    }
    if (typeof onRefresh === "function") {
      const refreshVersion = nextVersion || version;
      if (refreshVersion) await onRefresh(refreshVersion);
    }
    setIsRoundSelectModalOpen(false);
  }, [
    modalVersionId,
    modalDeptId,
    modalTeamId,
    versions,
    setVersion,
    selectableDepartments,
    pushToast,
    setSelectedDeptId,
    setSelectedTeamId,
    setProjectId,
    setHasConfirmedRound,
    onRefresh,
    version,
  ]);

  return {
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
    hasConfirmedRound,
  };
}
