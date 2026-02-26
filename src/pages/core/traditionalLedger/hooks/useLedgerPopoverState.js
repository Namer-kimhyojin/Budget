import { useCallback, useEffect, useRef, useState } from 'react';

export function useLedgerPopoverState() {
  const [openMokActionEntryId, setOpenMokActionEntryId] = useState(null);
  const [mokActionAnchor, setMokActionAnchor] = useState(null);
  const mokActionRefs = useRef({});
  const mokActionPopoverRef = useRef(null);

  const [openHierarchyActionId, setOpenHierarchyActionId] = useState(null);
  const [hierarchyActionAnchor, setHierarchyActionAnchor] = useState(null);
  const hierarchyActionRefs = useRef({});
  const hierarchyActionPopoverRef = useRef(null);
  const [isHierarchyAddMenuOpen, setIsHierarchyAddMenuOpen] = useState(false);
  const [hierarchySelectedGwanId, setHierarchySelectedGwanId] = useState('');
  const [hierarchySelectedHangId, setHierarchySelectedHangId] = useState('');
  const [hierarchySelectedMokId, setHierarchySelectedMokId] = useState('');
  const [hierarchyAddLoading, setHierarchyAddLoading] = useState(false);
  const [hierarchyCommentData, setHierarchyCommentData] = useState(null);
  const [hierarchyDeleteTarget, setHierarchyDeleteTarget] = useState(null);
  const [hierarchyDeleteLinkedEntries, setHierarchyDeleteLinkedEntries] = useState([]);
  const [supportingDocsTarget, setSupportingDocsTarget] = useState(null);

  const [openLogEntry, setOpenLogEntry] = useState(null);
  const [logAnchor, setLogAnchor] = useState(null);
  const [newLogEntries, setNewLogEntries] = useState({});
  const logPopoverRef = useRef(null);

  const setMokActionRef = useCallback((entryId, node) => {
    if (node) mokActionRefs.current[entryId] = node;
    else delete mokActionRefs.current[entryId];
  }, []);

  const clearNewLogEntries = useCallback(() => {
    setNewLogEntries({});
  }, []);

  const closeMokAction = useCallback(() => {
    setOpenMokActionEntryId(null);
    setMokActionAnchor(null);
  }, []);

  const closeHierarchyAction = useCallback(() => {
    setOpenHierarchyActionId(null);
    setHierarchyActionAnchor(null);
    setIsHierarchyAddMenuOpen(false);
    setHierarchySelectedGwanId('');
    setHierarchySelectedHangId('');
    setHierarchySelectedMokId('');
    setHierarchyAddLoading(false);
    setHierarchyCommentData(null);
  }, []);

  const closeLogPopover = useCallback(() => {
    setOpenLogEntry(null);
    setLogAnchor(null);
  }, []);

  const closeHierarchyDeleteModal = useCallback(() => {
    setHierarchyDeleteTarget(null);
    setHierarchyDeleteLinkedEntries([]);
  }, []);

  const closeSupportingDocsModal = useCallback(() => {
    setSupportingDocsTarget(null);
  }, []);

  const openLogPopover = useCallback((entry, buttonEl, mode = 'change') => {
    const targetId = Number(entry.id);
    if (openLogEntry?.id === targetId && openLogEntry?.mode === mode && !openLogEntry?.groupKey) {
      closeLogPopover();
      return;
    }
    const rect = buttonEl.getBoundingClientRect();
    const menuWidth = 336;
    const menuHeight = 216;
    const edge = 8;
    const downTop = rect.bottom + 6;
    const upTop = rect.top - menuHeight - 6;
    const nextTop = downTop + menuHeight <= window.innerHeight - edge ? downTop : Math.max(edge, upTop);
    const nextLeft = Math.min(
      Math.max(rect.left - menuWidth + rect.width, edge),
      Math.max(edge, window.innerWidth - menuWidth - edge)
    );
    setLogAnchor({ top: nextTop, left: nextLeft });
    setOpenLogEntry({
      id: targetId,
      title: entry.subject_name || entry.subject_code || `항목 ${targetId}`,
      mode,
      groupKey: null,
      entryIds: null,
    });
    setNewLogEntries((prev) => {
      const key = String(targetId);
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [openLogEntry?.id, openLogEntry?.mode, openLogEntry?.groupKey, closeLogPopover]);

  const openGroupLogPopover = useCallback((groupKey, groupTitle, entryIds, buttonEl, mode = 'change') => {
    if (openLogEntry?.groupKey === groupKey && openLogEntry?.mode === mode) {
      closeLogPopover();
      return;
    }
    const rect = buttonEl.getBoundingClientRect();
    const menuWidth = 336;
    const menuHeight = 260;
    const edge = 8;
    const downTop = rect.bottom + 6;
    const upTop = rect.top - menuHeight - 6;
    const nextTop = downTop + menuHeight <= window.innerHeight - edge ? downTop : Math.max(edge, upTop);
    const nextLeft = Math.min(
      Math.max(rect.left - menuWidth + rect.width, edge),
      Math.max(edge, window.innerWidth - menuWidth - edge)
    );
    setLogAnchor({ top: nextTop, left: nextLeft });
    setOpenLogEntry({
      id: null,
      title: groupTitle,
      mode,
      groupKey,
      entryIds,
    });
    setNewLogEntries((prev) => {
      const hasAny = entryIds.some((entryId) => prev[String(entryId)]);
      if (!hasAny) return prev;
      const next = { ...prev };
      entryIds.forEach((entryId) => { delete next[String(entryId)]; });
      return next;
    });
  }, [openLogEntry?.groupKey, openLogEntry?.mode, closeLogPopover]);

  const openMokAction = useCallback((entryId, buttonEl) => {
    const rect = buttonEl.getBoundingClientRect();
    const menuWidth = 156;
    const menuHeight = 88;
    const edge = 8;
    const downTop = rect.bottom + 6;
    const upTop = rect.top - menuHeight - 6;
    const nextTop = downTop + menuHeight <= window.innerHeight - edge ? downTop : Math.max(edge, upTop);
    const nextLeft = Math.min(
      Math.max(rect.left, edge),
      Math.max(edge, window.innerWidth - menuWidth - edge)
    );
    setMokActionAnchor({ top: nextTop, left: nextLeft });
    setOpenMokActionEntryId(entryId);
  }, []);

  const openHierarchyAction = useCallback((subjectId, buttonEl, commentData) => {
    const rect = buttonEl.getBoundingClientRect();
    // Anchor the base action popover close to the clicked hierarchy button.
    const menuWidth = 220;
    const edge = 8;
    const estimatedMenuHeight = 120;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const viewportLeft = window.visualViewport?.offsetLeft ?? 0;
    const viewportTop = window.visualViewport?.offsetTop ?? 0;
    const minLeft = viewportLeft + edge;
    const minTop = viewportTop + edge;
    const downTop = rect.bottom + 6;
    const upTop = rect.top - estimatedMenuHeight - 6;
    const maxVisibleTop = viewportTop + viewportHeight - edge;
    const alignBottom = downTop + estimatedMenuHeight > maxVisibleTop;
    const baseTop = alignBottom ? upTop : downTop;
    const maxTop = Math.max(minTop, viewportTop + viewportHeight - estimatedMenuHeight - edge);
    const nextTop = Math.min(Math.max(minTop, baseTop), maxTop);
    const maxLeft = Math.max(minLeft, viewportLeft + viewportWidth - menuWidth - edge);
    const nextLeft = Math.min(
      Math.max(rect.left, minLeft),
      maxLeft
    );
    setHierarchyActionAnchor({ top: nextTop, left: nextLeft, alignBottom });
    setOpenHierarchyActionId(subjectId);
    setHierarchyCommentData(commentData);
    setIsHierarchyAddMenuOpen(false);
    setHierarchySelectedGwanId('');
    setHierarchySelectedHangId('');
    setHierarchySelectedMokId('');
  }, []);

  useEffect(() => {
    if (openMokActionEntryId == null) return undefined;

    const handleOutside = (event) => {
      const wrapper = mokActionRefs.current[openMokActionEntryId];
      const popover = mokActionPopoverRef.current;
      if (wrapper && wrapper.contains(event.target)) return;
      if (popover && popover.contains(event.target)) return;
      closeMokAction();
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') closeMokAction();
    };
    const handleViewportChange = () => {
      closeMokAction();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [openMokActionEntryId, closeMokAction]);

  useEffect(() => {
    if (openHierarchyActionId == null) return undefined;

    const handleOutside = (event) => {
      const wrapper = hierarchyActionRefs.current[openHierarchyActionId];
      const popover = hierarchyActionPopoverRef.current;
      if (wrapper && wrapper.contains(event.target)) return;
      if (popover && popover.contains(event.target)) return;
      closeHierarchyAction();
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') closeHierarchyAction();
    };
    const handleViewportChange = () => closeHierarchyAction();

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', handleViewportChange);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [openHierarchyActionId, closeHierarchyAction]);

  useEffect(() => {
    if (!openLogEntry?.id && !openLogEntry?.groupKey) return undefined;

    const handleOutside = (event) => {
      const popover = logPopoverRef.current;
      if (popover && popover.contains(event.target)) return;
      if (openLogEntry?.id && event.target instanceof Element && event.target.closest(`[data-log-entry-btn="${openLogEntry.id}"]`)) return;
      if (openLogEntry?.groupKey && event.target instanceof Element && event.target.closest(`[data-log-entry-btn="${openLogEntry.groupKey}"]`)) return;
      closeLogPopover();
    };
    const handleEsc = (event) => {
      if (event.key === 'Escape') closeLogPopover();
    };
    const handleViewportChange = () => {
      closeLogPopover();
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [openLogEntry, closeLogPopover]);

  return {
    openMokActionEntryId,
    mokActionAnchor,
    mokActionRefs,
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
    newLogEntries,
    setNewLogEntries,
    clearNewLogEntries,
    closeLogPopover,
    openLogPopover,
    openGroupLogPopover,
    hierarchyDeleteTarget,
    setHierarchyDeleteTarget,
    hierarchyDeleteLinkedEntries,
    setHierarchyDeleteLinkedEntries,
    closeHierarchyDeleteModal,
    supportingDocsTarget,
    setSupportingDocsTarget,
    closeSupportingDocsModal,
  };
}
