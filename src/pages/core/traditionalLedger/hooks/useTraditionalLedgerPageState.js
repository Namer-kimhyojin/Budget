import { useMemo, useRef, useState } from 'react';

export function useTraditionalLedgerPageState({
  targetDeptId,
  targetTeamId,
  orgs,
}) {
  const [selectedDeptId, setSelectedDeptId] = useState(targetDeptId || null);
  const [selectedTeamId, setSelectedTeamId] = useState(targetTeamId || null);

  const [projectId, setProjectId] = useState(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const paramProj = params.get('project');
    if (paramProj) return Number(paramProj);
    return null;
  });
  const [viewType, setViewType] = useState('expense');
  const [showMyEntries, setShowMyEntries] = useState(false);
  // 컬럼 가시성: true = 숨김
  const [hiddenCols, setHiddenCols] = useState({ jang: false, gwan: false, hang: false, mok: false, budget: false, base: false, diff: false });
  const toggleCol = (col) => setHiddenCols(prev => ({ ...prev, [col]: !prev[col] }));
  const applyColPreset = (preset) => {
    if (preset === 'compact') {
      // 강제로 "항, 목, 예산액, 증감액"만 보이도록 함 (산출내역은 상시 노출)
      setHiddenCols({
        jang: true,
        gwan: true,
        hang: false,
        mok: false,
        budget: false,
        base: true,
        diff: false,
      });
    }
    if (preset === 'reset') setHiddenCols({ jang: false, gwan: false, hang: false, mok: false, budget: false, base: false, diff: false });
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [localDetails, setLocalDetails] = useState({});
  const [addingEntryId, setAddingEntryId] = useState(null);
  const [deletingDetailId, setDeletingDetailId] = useState(null);
  const [focusDetailId, setFocusDetailId] = useState(null);
  const [commentEntryId, setCommentEntryId] = useState(null);
  const [commentSubjectTarget, setCommentSubjectTarget] = useState(null);
  const [commentUnresolvedLoaded, setCommentUnresolvedLoaded] = useState(true);
  const [unresolvedByEntryId, setUnresolvedByEntryId] = useState({});
  const [unresolvedBySubjectId, setUnresolvedBySubjectId] = useState({});
  const [unresolvedRootTypes, setUnresolvedRootTypes] = useState([]);
  const [hasConfirmedRound, setHasConfirmedRound] = useState(false);
  const [modalDeptIdBridge, setModalDeptIdBridge] = useState('');
  const [supportingDocsSubjectIds, setSupportingDocsSubjectIds] = useState(
    new Set(),
  );

  const autoSaveTimersRef = useRef({});
  const autoSavePendingRef = useRef({});
  const autoSaveAbortRef = useRef({});
  const autoSaveSuccessAtRef = useRef(0);

  const commentScopeOrgId = selectedTeamId || selectedDeptId || null;
  const commentScopeOrgIds = useMemo(() => {
    const normalizedTeamId = Number(selectedTeamId);
    if (Number.isFinite(normalizedTeamId) && normalizedTeamId > 0) {
      return [normalizedTeamId];
    }

    const normalizedDeptId = Number(selectedDeptId);
    if (!Number.isFinite(normalizedDeptId) || normalizedDeptId <= 0) {
      return [];
    }

    const teamIds = (orgs || [])
      .filter((org) => Number(org?.parent) === normalizedDeptId)
      .map((org) => Number(org?.id))
      .filter((id) => Number.isFinite(id) && id > 0);
    return [normalizedDeptId, ...teamIds];
  }, [selectedTeamId, selectedDeptId, orgs]);

  return {
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
  };
}
