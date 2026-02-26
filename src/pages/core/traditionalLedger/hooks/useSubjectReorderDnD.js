import { useCallback, useEffect, useRef, useState } from "react";

export function useSubjectReorderDnD({
  subjects,
  isVersionEditable,
  authAxios,
  onRefresh,
  onRefreshSubjects,
  alertFn,
}) {
  const [draggingSubjectId, setDraggingSubjectId] = useState(null);
  const [dragOverToken, setDragOverToken] = useState("");
  const pointerSubjectDragRef = useRef({
    subjectId: null,
    startX: 0,
    startY: 0,
    moved: false,
  });
  const suppressNextActionClickRef = useRef(false);

  const normalizeParentId = useCallback((value) => {
    if (value == null || value === "") return null;
    const numValue = Number(value);
    return Number.isFinite(numValue) ? numValue : null;
  }, []);

  const getCanonicalSubject = useCallback(
    (subjectObj) => {
      if (!subjectObj) return null;
      const subjectId = Number(subjectObj.id);
      if (!Number.isFinite(subjectId)) return null;
      return subjects.find((item) => Number(item.id) === subjectId) || subjectObj;
    },
    [subjects],
  );

  const getSiblingSubjects = useCallback(
    (subjectObj) => {
      const canonical = getCanonicalSubject(subjectObj);
      if (!canonical) return [];
      const parentId = normalizeParentId(canonical.parent);
      const level = Number(canonical.level);
      return (subjects || [])
        .filter(
          (item) =>
            item.subject_type === canonical.subject_type &&
            normalizeParentId(item.parent) === parentId &&
            Number(item.level) === level,
        )
        .sort(
          (a, b) =>
            (a.sort_order || 0) - (b.sort_order || 0) ||
            Number(a.id) - Number(b.id),
        );
    },
    [subjects, normalizeParentId, getCanonicalSubject],
  );

  const refreshSubjectList = useCallback(async () => {
    if (onRefreshSubjects) {
      await onRefreshSubjects();
      return;
    }
    if (onRefresh) {
      await onRefresh();
    }
  }, [onRefreshSubjects, onRefresh]);

  const handleSubjectMove = useCallback(
    async (subjectObj, direction) => {
      if (!isVersionEditable || !subjects || !subjectObj) return;

      const siblings = getSiblingSubjects(subjectObj);
      const targetId = Number(subjectObj.id);
      const idx = siblings.findIndex((s) => Number(s.id) === targetId);
      if (idx === -1) return;

      if (direction === "up" && idx > 0) {
        const temp = siblings[idx - 1];
        siblings[idx - 1] = siblings[idx];
        siblings[idx] = temp;
      } else if (direction === "down" && idx < siblings.length - 1) {
        const temp = siblings[idx + 1];
        siblings[idx + 1] = siblings[idx];
        siblings[idx] = temp;
      } else {
        return;
      }

      try {
        const orderedIds = siblings.map((s) => s.id);
        await authAxios.post("/api/subjects/reorder/", { ordered_ids: orderedIds });
        await refreshSubjectList();
      } catch {
        alertFn('Failed to change item order.');
      }
    },
    [
      isVersionEditable,
      subjects,
      getSiblingSubjects,
      authAxios,
      refreshSubjectList,
      alertFn,
    ],
  );

  const parseDraggedSubjectId = useCallback(
    (event) => {
      const raw =
        event?.dataTransfer?.getData("application/x-ibms-subject-id") ||
        event?.dataTransfer?.getData("text/plain") ||
        "";
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
      const pointerId = Number(pointerSubjectDragRef.current?.subjectId || 0);
      if (Number.isFinite(pointerId) && pointerId > 0) return pointerId;
      const stateId = Number(draggingSubjectId || 0);
      return Number.isFinite(stateId) && stateId > 0 ? stateId : null;
    },
    [draggingSubjectId],
  );

  const isSameSiblingGroup = useCallback(
    (left, right) => {
      if (!left || !right) return false;
      return (
        left.subject_type === right.subject_type &&
        Number(left.level) === Number(right.level) &&
        normalizeParentId(left.parent) === normalizeParentId(right.parent)
      );
    },
    [normalizeParentId],
  );

  const resolveDropPosition = useCallback((event) => {
    const rect = event?.currentTarget?.getBoundingClientRect?.();
    if (!rect) return "before";
    return event.clientY >= rect.top + rect.height / 2 ? "after" : "before";
  }, []);

  const resetPointerSubjectDrag = useCallback(() => {
    pointerSubjectDragRef.current = {
      subjectId: null,
      startX: 0,
      startY: 0,
      moved: false,
    };
  }, []);

  const reorderSubjectByDrop = useCallback(
    async ({ draggedId, targetSubjectObj, position = "before" }) => {
      const targetId = Number(targetSubjectObj?.id || 0);
      setDragOverToken("");
      if (!draggedId || !targetId || draggedId === targetId) {
        setDraggingSubjectId(null);
        return;
      }

      const draggedSubject = getCanonicalSubject({ id: draggedId });
      const targetSubject = getCanonicalSubject(targetSubjectObj);
      if (
        !draggedSubject ||
        !targetSubject ||
        !isSameSiblingGroup(draggedSubject, targetSubject)
      ) {
        setDraggingSubjectId(null);
        return;
      }

      const siblings = getSiblingSubjects(targetSubject);
      const originalIds = siblings.map((item) => Number(item.id));
      const draggedIndex = siblings.findIndex(
        (item) => Number(item.id) === draggedId,
      );
      const targetIndex = siblings.findIndex(
        (item) => Number(item.id) === targetId,
      );
      if (draggedIndex < 0 || targetIndex < 0) {
        setDraggingSubjectId(null);
        return;
      }

      const working = [...siblings];
      const [draggedItem] = working.splice(draggedIndex, 1);
      let insertAt = targetIndex;
      if (draggedIndex < targetIndex) insertAt -= 1;
      if (position === "after") insertAt += 1;
      if (insertAt < 0) insertAt = 0;
      if (insertAt > working.length) insertAt = working.length;
      working.splice(insertAt, 0, draggedItem);

      const reorderedIds = working.map((item) => Number(item.id));
      const changed = reorderedIds.some((id, idx) => id !== originalIds[idx]);
      if (!changed) {
        setDraggingSubjectId(null);
        return;
      }

      try {
        await authAxios.post("/api/subjects/reorder/", { ordered_ids: reorderedIds });
        await refreshSubjectList();
      } catch {
        alertFn('Failed to change item order.');
      } finally {
        setDraggingSubjectId(null);
      }
    },
    [
      getCanonicalSubject,
      isSameSiblingGroup,
      getSiblingSubjects,
      authAxios,
      refreshSubjectList,
      alertFn,
    ],
  );

  const handleSubjectDragStart = useCallback(
    (event, subjectObj) => {
      if (!isVersionEditable || !subjectObj?.id) return;
      const subjectId = Number(subjectObj.id);
      if (!Number.isFinite(subjectId) || subjectId <= 0) return;
      setDraggingSubjectId(subjectId);
      setDragOverToken("");
      try {
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(
            "application/x-ibms-subject-id",
            String(subjectId),
          );
          event.dataTransfer.setData("text/plain", String(subjectId));
        }
      } catch {
        // no-op
      }
    },
    [isVersionEditable],
  );

  const handleSubjectDragOver = useCallback(
    (event, targetSubjectObj) => {
      if (!isVersionEditable) return;
      const draggedId = parseDraggedSubjectId(event);
      const targetId = Number(targetSubjectObj?.id || 0);
      if (!draggedId || !targetId || draggedId === targetId) return;
      const draggedSubject = getCanonicalSubject({ id: draggedId });
      const targetSubject = getCanonicalSubject(targetSubjectObj);
      if (
        !draggedSubject ||
        !targetSubject ||
        !isSameSiblingGroup(draggedSubject, targetSubject)
      )
        return;

      event.preventDefault();
      event.stopPropagation();
      const position = resolveDropPosition(event);
      setDragOverToken(`${targetId}:${position}`);
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    },
    [
      isVersionEditable,
      parseDraggedSubjectId,
      getCanonicalSubject,
      isSameSiblingGroup,
      resolveDropPosition,
    ],
  );

  const handleSubjectDrop = useCallback(
    async (event, targetSubjectObj) => {
      event.preventDefault();
      event.stopPropagation();
      const draggedId = parseDraggedSubjectId(event);
      const position = resolveDropPosition(event);
      await reorderSubjectByDrop({ draggedId, targetSubjectObj, position });
    },
    [parseDraggedSubjectId, resolveDropPosition, reorderSubjectByDrop],
  );

  const handleSubjectDragEnd = useCallback(() => {
    resetPointerSubjectDrag();
    setDraggingSubjectId(null);
    setDragOverToken("");
  }, [resetPointerSubjectDrag]);

  const handleSubjectPointerDown = useCallback(
    (event, subjectObj) => {
      if (!isVersionEditable || !subjectObj?.id) return;
      if (event.button !== 0) return;
      const subjectId = Number(subjectObj.id);
      if (!Number.isFinite(subjectId) || subjectId <= 0) return;
      pointerSubjectDragRef.current = {
        subjectId,
        startX: Number(event.clientX || 0),
        startY: Number(event.clientY || 0),
        moved: false,
      };
      setDragOverToken("");
    },
    [isVersionEditable],
  );

  const handleSubjectPointerMove = useCallback(
    (event, targetSubjectObj) => {
      const pointerState = pointerSubjectDragRef.current;
      if (!pointerState.subjectId) return;

      const deltaX = Math.abs(Number(event.clientX || 0) - pointerState.startX);
      const deltaY = Math.abs(Number(event.clientY || 0) - pointerState.startY);
      if (!pointerState.moved && deltaX + deltaY >= 4) {
        pointerState.moved = true;
        setDraggingSubjectId(pointerState.subjectId);
      }
      if (!pointerState.moved) return;

      handleSubjectDragOver(event, targetSubjectObj);
    },
    [handleSubjectDragOver],
  );

  const handleSubjectPointerUp = useCallback(
    async (event, targetSubjectObj) => {
      const pointerState = pointerSubjectDragRef.current;
      const draggedId = Number(pointerState.subjectId || 0);
      const didMove = !!pointerState.moved;
      resetPointerSubjectDrag();

      if (!draggedId) {
        setDraggingSubjectId(null);
        setDragOverToken("");
        return;
      }
      if (!didMove) {
        setDraggingSubjectId(null);
        setDragOverToken("");
        return;
      }

      suppressNextActionClickRef.current = true;
      event.preventDefault();
      event.stopPropagation();
      const position = resolveDropPosition(event);
      await reorderSubjectByDrop({ draggedId, targetSubjectObj, position });
    },
    [resetPointerSubjectDrag, resolveDropPosition, reorderSubjectByDrop],
  );

  const handleSubjectActionClickCapture = useCallback((event) => {
    if (!suppressNextActionClickRef.current) return;
    suppressNextActionClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  useEffect(() => {
    const handleWindowMouseUp = () => {
      const pointerState = pointerSubjectDragRef.current;
      if (!pointerState.subjectId) return;
      resetPointerSubjectDrag();
      setDraggingSubjectId(null);
      setDragOverToken("");
    };
    window.addEventListener("mouseup", handleWindowMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [resetPointerSubjectDrag]);

  const getSubjectDragProps = useCallback(
    (subjectObj) => {
      if (!isVersionEditable || !subjectObj?.id) return {};
      return {
        draggable: true,
        onDragStart: (event) => handleSubjectDragStart(event, subjectObj),
        onDragOver: (event) => handleSubjectDragOver(event, subjectObj),
        onDrop: (event) => {
          void handleSubjectDrop(event, subjectObj);
        },
        onDragEnd: handleSubjectDragEnd,
        onMouseDown: (event) => handleSubjectPointerDown(event, subjectObj),
        onMouseMove: (event) => handleSubjectPointerMove(event, subjectObj),
        onMouseEnter: (event) => handleSubjectPointerMove(event, subjectObj),
        onMouseUp: (event) => {
          void handleSubjectPointerUp(event, subjectObj);
        },
        onClickCapture: handleSubjectActionClickCapture,
      };
    },
    [
      isVersionEditable,
      handleSubjectDragStart,
      handleSubjectDragOver,
      handleSubjectDrop,
      handleSubjectDragEnd,
      handleSubjectPointerDown,
      handleSubjectPointerMove,
      handleSubjectPointerUp,
      handleSubjectActionClickCapture,
    ],
  );

  const getSubjectDragStyle = useCallback(
    (subjectObj) => {
      const subjectId = Number(subjectObj?.id || 0);
      if (!subjectId) return null;
      const isDragging = Number(draggingSubjectId) === subjectId;
      const hoverBefore = dragOverToken === `${subjectId}:before`;
      const hoverAfter = dragOverToken === `${subjectId}:after`;
      const style = {
        cursor: isVersionEditable ? (isDragging ? "grabbing" : "grab") : "pointer",
        userSelect: "none",
        touchAction: "none",
      };
      if (isDragging) {
        style.opacity = 0.55;
      }
      if (hoverBefore || hoverAfter) {
        style.background = "#eff6ff";
        style.outline = "1px solid #93c5fd";
        style.outlineOffset = 0;
        style.boxShadow = hoverBefore
          ? "inset 0 2px 0 #3b82f6"
          : "inset 0 -2px 0 #3b82f6";
      }
      return style;
    },
    [draggingSubjectId, dragOverToken, isVersionEditable],
  );

  return {
    handleSubjectMove,
    getSubjectDragProps,
    getSubjectDragStyle,
  };
}

