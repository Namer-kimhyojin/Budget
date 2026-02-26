import { useEffect } from 'react';

export function useLedgerUiEffects({
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
  entries,
}) {
  useEffect(() => {
    if (targetDeptId) setSelectedDeptId(targetDeptId);
  }, [targetDeptId, setSelectedDeptId]);

  useEffect(() => {
    if (targetTeamId) setSelectedTeamId(targetTeamId);
  }, [targetTeamId, setSelectedTeamId]);

  useEffect(() => {
    if (!selectableDepartments.length) return;
    const exists = selectableDepartments.some((dept) => Number(dept.id) === Number(selectedDeptId));
    if (!exists) setSelectedDeptId(selectableDepartments[0].id);
  }, [selectableDepartments, selectedDeptId, setSelectedDeptId]);

  useEffect(() => {
    if (!selectedDeptId || selectedTeamId) return;
    if (!myOrg || isAdminUser) return;
    if (Number(myOrg.parent) === Number(selectedDeptId)) {
      setSelectedTeamId(Number(myOrg.id));
    }
  }, [selectedDeptId, selectedTeamId, myOrg, isAdminUser, setSelectedTeamId]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const stillExists = selectableTeams.some((team) => Number(team.id) === Number(selectedTeamId));
    if (!stillExists) setSelectedTeamId(null);
  }, [selectedTeamId, selectableTeams, setSelectedTeamId]);

  useEffect(() => () => {
    Object.values(autoSaveTimersRef.current).forEach((timerId) => clearTimeout(timerId));
    Object.values(autoSaveAbortRef.current).forEach((controller) => {
      try { controller.abort(); } catch { /* ignore */ }
    });
  }, [autoSaveAbortRef, autoSaveTimersRef]);

  useEffect(() => {
    if (!focusDetailId) return;
    const el = document.querySelector(`[data-detail-name-id="${focusDetailId}"]`);
    if (el) {
      el.focus();
      el.select?.();
      setFocusDetailId(null);
    }
  }, [focusDetailId, entries, setFocusDetailId]);
}
