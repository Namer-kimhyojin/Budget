import { useCallback } from 'react';

export function useLedgerDetailDnD({
  isVersionEditable,
  versionLockMessage,
  pushToast,
  activeEntries,
  canEditEntry,
  EDIT_BLOCKED_MSG,
  authAxios,
  onRefresh,
  modalApi,
}) {
  return useCallback(async (result) => {
    const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);
    if (!result.destination) return;
    if (
      result.source?.droppableId === result.destination?.droppableId
      && Number(result.source?.index) === Number(result.destination?.index)
    ) {
      return;
    }
    if (!isVersionEditable) {
      pushToast(versionLockMessage, 'error');
      return;
    }

    const sourceDropId = String(result.source?.droppableId || '');
    const sourceMatch = sourceDropId.match(/^drop-entry-(\d+)$/);
    const typeText = String(result.type || '');
    const typeMatch = typeText.match(/^entry-(\d+)$/);
    const entryId = Number(sourceMatch?.[1] || typeMatch?.[1] || 0);
    if (!Number.isFinite(entryId) || entryId <= 0) return;

    const entry = activeEntries.find((item) => Number(item.id) === entryId);
    if (!entry) return;
    if (!canEditEntry(entryId)) {
      _alert(EDIT_BLOCKED_MSG);
      return;
    }

    const items = [...(entry.details || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    try {
      await Promise.all(items.map((item, idx) => authAxios.patch(`/api/details/${item.id}/`, { sort_order: idx })));
      onRefresh();
    } catch {
      _alert('Failed to reorder items.');
    }
  }, [
    isVersionEditable,
    versionLockMessage,
    pushToast,
    activeEntries,
    canEditEntry,
    EDIT_BLOCKED_MSG,
    authAxios,
    onRefresh,
    modalApi,
  ]);
}
