import { useCallback, useEffect, useRef } from 'react';
import { apiErrorMessage } from '../shared';

export function useLedgerEntryActions({
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
  activeEntries,
  entries,
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
  onDetailConflict,
}) {
  const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);
  const detailUpdatedAtRef = useRef({});

  useEffect(() => {
    detailUpdatedAtRef.current = { ...detailUpdatedAtRef.current, ...(detailUpdatedAtById || {}) };
  }, [detailUpdatedAtById]);

  const saveDetail = useCallback(async (id, data, { source = 'manual', refreshMode = 'debounced' } = {}) => {
    const entryId = detailToEntryId[id];
    if (!isVersionEditable) {
      pushToast(versionLockMessage, 'error');
      return false;
    }
    if (entryId && !canEditEntry(entryId)) {
      pushToast(EDIT_BLOCKED_MSG, 'error');
      return false;
    }

    try {
      if (autoSaveAbortRef.current[id]) {
        autoSaveAbortRef.current[id].abort();
      }
      const controller = new AbortController();
      autoSaveAbortRef.current[id] = controller;
      const payload = { ...data };
      const knownUpdatedAt = detailUpdatedAtRef.current[id];
      if (knownUpdatedAt) payload._updated_at = knownUpdatedAt;
      const response = await authAxios.patch(`/api/details/${id}/`, payload, { signal: controller.signal });
      if (response?.data?.updated_at) {
        detailUpdatedAtRef.current[id] = response.data.updated_at;
      }
      if (autoSaveAbortRef.current[id] === controller) {
        delete autoSaveAbortRef.current[id];
      }

      if (refreshMode === 'immediate') {
        onRefresh();
      } else if (refreshMode === 'debounced') {
        if (autoSaveTimersRef.current.__refresh) clearTimeout(autoSaveTimersRef.current.__refresh);
        autoSaveTimersRef.current.__refresh = setTimeout(() => onRefresh(), 500);
      }
      return true;
    } catch (e) {
      if (e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError') return false;
      if (e?.response?.status === 409) {
        pushToast('다른 사용자가 먼저 수정했습니다. 최신 데이터로 새로고침합니다.', 'error');
        onDetailConflict?.();
        onRefresh();
        return false;
      }
      console.error(e);
      pushToast(apiErrorMessage(e, source === 'auto' ? '자동저장에 실패했습니다.' : '저장에 실패했습니다.'), 'error');
      return false;
    }
  }, [authAxios, onRefresh, detailToEntryId, canEditEntry, isVersionEditable, versionLockMessage, pushToast, EDIT_BLOCKED_MSG, autoSaveAbortRef, autoSaveTimersRef, onDetailConflict]);

  const flushAutoSave = useCallback(async (id, patch = null) => {
    if (autoSaveTimersRef.current[id]) {
      clearTimeout(autoSaveTimersRef.current[id]);
      delete autoSaveTimersRef.current[id];
    }
    const merged = { ...(autoSavePendingRef.current[id] || {}), ...(patch || {}) };
    delete autoSavePendingRef.current[id];
    if (Object.keys(merged).length === 0) return;
    const ok = await saveDetail(id, merged, { source: 'manual', refreshMode: 'immediate' });
    if (ok) pushToast('자동저장 완료', 'success');
  }, [saveDetail, pushToast, autoSaveTimersRef, autoSavePendingRef]);

  const scheduleAutoSave = useCallback((id, patch) => {
    autoSavePendingRef.current[id] = { ...(autoSavePendingRef.current[id] || {}), ...(patch || {}) };
    if (autoSaveTimersRef.current[id]) clearTimeout(autoSaveTimersRef.current[id]);
    autoSaveTimersRef.current[id] = setTimeout(async () => {
      const merged = autoSavePendingRef.current[id] || {};
      delete autoSavePendingRef.current[id];
      delete autoSaveTimersRef.current[id];
      if (Object.keys(merged).length === 0) return;
      const ok = await saveDetail(id, merged, { source: 'auto', refreshMode: 'debounced' });
      if (ok) {
        const now = Date.now();
        if (now - autoSaveSuccessAtRef.current > 1400) {
          autoSaveSuccessAtRef.current = now;
          pushToast('자동저장 완료', 'success');
        }
      }
    }, 900);
  }, [saveDetail, pushToast, autoSavePendingRef, autoSaveTimersRef, autoSaveSuccessAtRef]);

  const updateLocalDetail = useCallback((id, data) => {
    if (!isVersionEditable) {
      pushToast(versionLockMessage, 'error');
      return;
    }
    setLocalDetails(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...data } }));
    scheduleAutoSave(id, data);
  }, [isVersionEditable, scheduleAutoSave, pushToast, versionLockMessage, setLocalDetails]);

  const addDetailRow = useCallback(async (entryId, options = {}) => {
    const { afterDetailId = null } = options || {};
    if (!entryId) return;
    if (addingEntryId === entryId) return;
    if (!isVersionEditable) {
      pushToast(versionLockMessage, 'error');
      return;
    }
    const knownEntry = activeEntries.find(e => Number(e.id) === Number(entryId))
      || entries.find(e => Number(e.id) === Number(entryId));
    const sortedDetails = [...(knownEntry?.details || [])]
      .sort((a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0));
    let nextSortOrder = (sortedDetails.reduce((max, d) => {
      const order = Number(d?.sort_order ?? -1);
      return Number.isFinite(order) ? Math.max(max, order) : max;
    }, -1)) + 1;
    if (knownEntry && knownEntry.status !== 'DRAFT') {
      _alert(EDIT_BLOCKED_MSG);
      return;
    }
    try {
      setAddingEntryId(entryId);
      const useInsertAfter = afterDetailId != null;

      const created = await authAxios.post('/api/details/', {
        entry: entryId,
        name: '새 산출내역',
        price: 0,
        qty: 1,
        freq: 1,
        ...(useInsertAfter ? { insert_after_detail_id: Number(afterDetailId) } : { sort_order: nextSortOrder }),
        currency_unit: '원',
        unit: '식',
        freq_unit: '회',
        source: '자체',
        organization: knownEntry?.organization || null,
      });
      setFocusDetailId(created?.data?.id || null);
      onRefresh();
      return created?.data || null;
    } catch (e) {
      console.groupCollapsed('[BudgetDetail] create failed');
      console.error('request', {
        entry: entryId,
        name: '새 산출내역',
        price: 0,
        qty: 1,
        freq: 1,
        sort_order: nextSortOrder,
        insert_after_detail_id: afterDetailId,
        currency_unit: '원',
        unit: '식',
        freq_unit: '회',
        source: '자체',
        organization: knownEntry?.organization || null,
      });
      console.error('response_status', e?.response?.status);
      console.error('response_data', e?.response?.data);
      console.error('axios_message', e?.message);
      console.groupEnd();
      const text = apiErrorMessage(e, '산출내역 추가 작업 중 오류가 발생했습니다.');
      console.error('AddDetailRow Error:', e);
      if (text.includes('non_field_errors') && text.includes('수정할 수 없습니다')) {
        onRefresh();
        _alert(EDIT_BLOCKED_MSG);
      } else {
        const detailInfo = e.response?.data ? `\n상세: ${JSON.stringify(e.response.data)}` : (e.message ? `\n메시지: ${e.message}` : '');
        pushToast(`${text}${detailInfo}`, 'error');
      }
      return null;
    } finally {
      setAddingEntryId(null);
    }
  }, [addingEntryId, isVersionEditable, pushToast, versionLockMessage, activeEntries, entries, EDIT_BLOCKED_MSG, authAxios, setFocusDetailId, onRefresh, setAddingEntryId]);

  const deleteDetail = useCallback(async (id) => {
    if (!isVersionEditable) {
      pushToast(versionLockMessage, 'error');
      return;
    }
    const entryId = detailToEntryId[id];
    if (entryId && !canEditEntry(entryId)) {
      _alert(EDIT_BLOCKED_MSG);
      return;
    }
    if (deletingDetailId === id) return;
    if (!(await modalApi.confirm('이 산출근거를 삭제하시겠습니까?'))) return;
    try {
      setDeletingDetailId(id);
      await authAxios.delete(`/api/details/${id}/`);
      onRefresh();
    } catch (e) {
      pushToast(apiErrorMessage(e, '삭제 실패'), 'error');
    } finally {
      setDeletingDetailId(null);
    }
  }, [isVersionEditable, pushToast, versionLockMessage, detailToEntryId, canEditEntry, EDIT_BLOCKED_MSG, deletingDetailId, modalApi, authAxios, onRefresh, setDeletingDetailId]);

  const deleteEntry = useCallback(async (id) => {
    if (!isVersionEditable) {
      pushToast(versionLockMessage, 'error');
      return;
    }
    if (!canEditEntry(id)) {
      _alert(EDIT_BLOCKED_MSG);
      return;
    }
    if (!(await modalApi.confirm('이 예산 항목을 삭제하시겠습니까?'))) return;
    try {
      await authAxios.delete(`/api/entries/${id}/`);
      onRefresh();
    } catch (e) {
      pushToast(apiErrorMessage(e, '삭제 실패'), 'error');
    }
  }, [isVersionEditable, pushToast, versionLockMessage, canEditEntry, EDIT_BLOCKED_MSG, modalApi, authAxios, onRefresh]);

  const addEntryFromHierarchyMenu = useCallback(async () => {
    if (!isVersionEditable) {
      pushToast(versionLockMessage, 'error');
      return;
    }
    if (!selectedScopeOrgId || !version?.year) {
      pushToast('선택된 부서 또는 회차 정보가 없습니다.', 'error');
      return;
    }
    // Determine which subject ID to use: mok > hang > gwan
    const mokId = Number(hierarchySelectedMokId || 0);
    const hangId = Number(hierarchySelectedHangId || 0);
    const gwanId = Number(hierarchySelectedGwanId || 0);
    const subjectId = mokId || hangId || gwanId;
    if (!subjectId) {
      pushToast('항목을 선택하세요.', 'error');
      return;
    }
    if (mokId && usedMokIdsInScope.has(mokId)) {
      pushToast('이미 추가된 목 항목입니다.', 'error');
      return;
    }
    try {
      setHierarchyAddLoading(true);
      await authAxios.post('/api/entries/', {
        subject: subjectId,
        organization: Number(selectedScopeOrgId),
        entrusted_project: projectId ? Number(projectId) : null,
        year: Number(version.year),
        supplemental_round: Number(version?.round ?? 0),
        budget_category: 'ORIGINAL',
        carryover_type: 'NONE',
      });
      onRefresh();
      pushToast('예산 항목이 추가되었습니다.');
      closeHierarchyAction();
    } catch (e) {
      pushToast(apiErrorMessage(e, '항목 추가 중 오류가 발생했습니다.'), 'error');
    } finally {
      setHierarchyAddLoading(false);
    }
  }, [isVersionEditable, pushToast, versionLockMessage, selectedScopeOrgId, version, hierarchySelectedMokId, hierarchySelectedHangId, hierarchySelectedGwanId, usedMokIdsInScope, setHierarchyAddLoading, authAxios, projectId, onRefresh, closeHierarchyAction]);

  const handleToggleHierarchyAddMenu = useCallback(() => {
    if (!isVersionEditable) {
      pushToast(versionLockMessage, 'error');
      return;
    }
    const parentLevel = Number(openHierarchyParentSubject?.level || 0);
    if (parentLevel >= 4 || (leafSubjectIds && leafSubjectIds.has(Number(openHierarchyParentSubject?.id)))) {
      modalApi.alert('최하위 항목(목)에서는 하위 항목을 추가할 수 없습니다.');
      return;
    }
    // Pre-check: are ALL leaf descendants already used?
    const parentId = Number(openHierarchyParentSubject?.id);
    const subjectType = openHierarchyParentSubject?.subject_type;
    if (parentId && subjects.length && usedMokIdsInScope) {
      // Collect all descendant leaf IDs under this parent
      const descendantLeafIds = [];
      const collectLeaves = (pid) => {
        const children = subjects.filter(s => s.subject_type === subjectType && Number(s.parent) === pid);
        if (children.length === 0) return; // pid itself might be leaf but we started from parent
        children.forEach(child => {
          const cid = Number(child.id);
          const isLeaf = leafSubjectIds && leafSubjectIds.has(cid);
          if (isLeaf) {
            descendantLeafIds.push(cid);
          } else {
            collectLeaves(cid);
          }
        });
      };
      collectLeaves(parentId);
      if (descendantLeafIds.length > 0 && descendantLeafIds.every(id => usedMokIdsInScope.has(id))) {
        modalApi.alert('추가할 수 있는 하위 항목이 없습니다.\n모든 항목이 이미 추가되었습니다.');
        return;
      }
    }
    setHierarchySelectedGwanId('');
    setHierarchySelectedHangId('');
    setHierarchySelectedMokId('');
    setIsHierarchyAddMenuOpen((prev) => !prev);
  }, [isVersionEditable, versionLockMessage, pushToast, openHierarchyParentSubject, subjects, leafSubjectIds, usedMokIdsInScope, modalApi, setHierarchySelectedGwanId, setHierarchySelectedHangId, setHierarchySelectedMokId, setIsHierarchyAddMenuOpen]);

  const handleDeleteHierarchySubject = useCallback(async () => {
    if (!isVersionEditable) {
      pushToast(versionLockMessage, 'error');
      return;
    }
    closeHierarchyAction();
    const [_type, id] = String(openHierarchyActionId || '').split('-');
    const subject = subjects.find((item) => Number(item.id) === Number(id));
    if (!subject) return;

    const targetIds = new Set();
    const collect = (sid) => {
      targetIds.add(Number(sid));
      subjects
        .filter((item) => Number(item.parent) === Number(sid))
        .forEach((child) => collect(child.id));
    };
    collect(subject.id);

    const rawLinkedEntries = entries.filter((entry) => targetIds.has(Number(entry.subject)));
    const uniqueLinkedEntries = [];
    const seenEntryIds = new Set();
    for (const e of rawLinkedEntries) {
      if (!seenEntryIds.has(e.id)) {
        uniqueLinkedEntries.push(e);
        seenEntryIds.add(e.id);
      }
    }

    setHierarchyDeleteTarget(subject);
    setHierarchyDeleteLinkedEntries(uniqueLinkedEntries);
  }, [isVersionEditable, versionLockMessage, pushToast, closeHierarchyAction, openHierarchyActionId, subjects, entries, setHierarchyDeleteTarget, setHierarchyDeleteLinkedEntries]);

  const confirmDeleteHierarchySubject = useCallback(async () => {
    if (!hierarchyDeleteTarget || !isVersionEditable) return;

    const subject = subjects.find(s => s.id === hierarchyDeleteTarget?.id);
    if (!subject) return;

    try {
      // Use the new force-delete endpoint which handles recursive deletion of 
      // linked entries and children subjects in a single backend transaction.
      await authAxios.delete(`/api/subjects/${subject.id}/force-delete/`, {
        params: {
          org_id: undefined,
          year: undefined,
        },
      });

      pushToast('과목이 삭제되었습니다.', 'success');
      closeHierarchyDeleteModal();
      onRefresh();
    } catch (e) {
      console.error('Force Delete Subject Error:', e);
      const msg = e?.response?.data?.error || apiErrorMessage(e, '삭제 중 오류가 발생했습니다.');
      pushToast(msg, 'error');
    }
  }, [authAxios, hierarchyDeleteTarget, subjects, onRefresh, pushToast, closeHierarchyDeleteModal, isVersionEditable]);

  const handleSelectHierarchyGwan = useCallback((subjectId) => {
    setHierarchySelectedGwanId(String(subjectId));
    setHierarchySelectedHangId('');
    setHierarchySelectedMokId('');
  }, [setHierarchySelectedGwanId, setHierarchySelectedHangId, setHierarchySelectedMokId]);

  const handleSelectHierarchyHang = useCallback((subjectId) => {
    setHierarchySelectedHangId(String(subjectId));
    setHierarchySelectedMokId('');
  }, [setHierarchySelectedHangId, setHierarchySelectedMokId]);

  const handleSelectHierarchyMok = useCallback((subjectId) => {
    setHierarchySelectedMokId(String(subjectId));
  }, [setHierarchySelectedMokId]);

  const handleOpenSupportingDocs = useCallback((subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;
    setSupportingDocsTarget(subject);
    closeHierarchyAction();
  }, [subjects, setSupportingDocsTarget, closeHierarchyAction]);

  return {
    saveDetail,
    flushAutoSave,
    scheduleAutoSave,
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
  };
}
