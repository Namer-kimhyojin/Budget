import React from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, MoreHorizontal, Paperclip, Plus, X } from 'lucide-react';
import { COLORS, num, numInThousand, varianceNumInThousand } from '../shared';

// 증감액 색상 스타일 (양수=파랑, 음수=빨강, 0=회색)
const varianceColor = (v) => {
  const n = Number(v) || 0;
  if (n > 0) return '#1d4ed8';
  if (n < 0) return '#dc2626';
  return '#94a3b8';
};
const varianceBg = (v) => {
  const n = Number(v) || 0;
  if (n > 0) return '#eff6ff';
  if (n < 0) return '#fef2f2';
  return 'transparent';
};
import {
  sheetContainer, sheetTable, thStyle, thNum, thCalcMerged, rowGwan, rowHang, rowMok, rowDetail, tdSpanned, tdEmpty, tdBase, tdAmtSum, tdAmtMok, tdMokLabelAction, tdMokLabelActionCompact, tdCalcBase, tdBlank, tdBudgetBlank, tdCalcNameCell, tdCalcPriceCell, tdCalcQtyCell, tdCalcUnitOpCell, tdCalcAmountCell, tdAmtMokCompact, formulaUnitOpWrap, formulaOperator, fName, fPrice, fQty, fFreq, fUnit, tableBottomPad, btnPlus, mokCellWrap, mokInlineHead, mokNameText, mokActionTrigger
} from '../styles';
import AutoResizeInput from './AutoResizeInput';
import EntryFlowInfo from './EntryFlowInfo';
import { useSubjectReorderDnD } from '../hooks/useSubjectReorderDnD';
import {
  SUBJECT_ACTION_WRAP,
  SUBJECT_MOVE_BUTTON,
  SUBJECT_MOVE_BUTTONS,
  collectUnresolvedTypesFromHangList,
  collectUnresolvedTypesFromMoks,
  renderHierarchyUnresolvedIcons,
} from './ledgerHierarchyUi';

export default function LedgerSheetSection({
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
  hiddenCols = {},
  toggleCol,
}) {
  const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);
  // 열 숨김 헬퍼
  // width:0 방식은 브라우저/줌 배율에 따라 빈 열 공간이 남는 경우가 있어
  // col + cell 모두 display:none 처리해 열 자체를 제거한다.
  const hCol = (col) => hiddenCols[col]
    ? { display: 'none' }
    : {};
  const hCell = (col) => hiddenCols[col]
    ? {
      display: 'none',
    }
    : {};
  const headerClickProps = (col, label) => {
    if (!toggleCol) return {};
    return {
      onClick: () => toggleCol(col),
      title: `${label} 열 숨기기`,
    };
  };
  const clickableHeaderStyle = toggleCol ? { cursor: 'pointer', userSelect: 'none' } : {};
  const showTransferColumns = (
    String(version?.creation_mode || '').toUpperCase() === 'TRANSFER'
    || Boolean(version?.source_version)
  );
  const [editingProjectId, setEditingProjectId] = React.useState(null);
  const [editingProjectName, setEditingProjectName] = React.useState('');
  const [savingProjectId, setSavingProjectId] = React.useState(null);
  const { handleSubjectMove, getSubjectDragProps, getSubjectDragStyle } = useSubjectReorderDnD({
    subjects,
    isVersionEditable,
    authAxios,
    onRefresh,
    onRefreshSubjects,
    alertFn: _alert,
  });

  const startEditProjectName = (projectId, currentName) => {
    setEditingProjectId(projectId);
    setEditingProjectName(currentName);
  };

  const cancelEditProjectName = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const saveProjectName = async (projectId) => {
    const trimmed = editingProjectName.trim();
    if (!trimmed) return;
    try {
      setSavingProjectId(projectId);
      await authAxios.patch(`/api/entrusted-projects/${projectId}/`, { name: trimmed });
      if (onRefreshProjects) {
        await onRefreshProjects();
      } else if (onRefresh) {
        await onRefresh();
      }
      setEditingProjectId(null);
      setEditingProjectName('');
    } catch {
      _alert('수탁사업명 수정에 실패했습니다.');
    } finally {
      setSavingProjectId(null);
    }
  };

  const resolveEntryUnresolvedTypes = (entry) => {
    if (commentUnresolvedLoaded) {
      const key = String(entry?.id ?? '');
      const unresolved = unresolvedByEntryId?.[key];
      if (Array.isArray(unresolved)) return unresolved;
      return Array.isArray(entry?.unresolved_types) ? entry.unresolved_types : [];
    }
    return Array.isArray(entry?.unresolved_types) ? entry.unresolved_types : [];
  };

  const resolveSubjectUnresolvedTypes = (subjectId) => {
    if (!commentUnresolvedLoaded || subjectId == null) return [];
    const key = String(subjectId);
    const unresolved = unresolvedBySubjectId?.[key];
    return Array.isArray(unresolved) ? unresolved : [];
  };

  const resolveRootUnresolvedTypes = () => {
    if (!commentUnresolvedLoaded) return [];
    return Array.isArray(unresolvedRootTypes) ? unresolvedRootTypes : [];
  };

  const getMokRowBg = (entry) => {
    const type = entry?.latest_comment_type;
    if (type === 'REQUEST') return '#fff5f5';
    if (type === 'DONE') return '#f0fdf4';
    if (type === 'QUESTION') return '#fefce8';
    if (type === 'ANSWER') return '#faf5ff';
    return '#ffffff';
  };

  const detailTabFields = ['name', 'price', 'qty', 'freq'];

  const focusAndSelectInput = (input) => {
    if (!input || input.disabled) return;
    input.focus();
    if (typeof input.select === 'function') input.select();
  };

  const getEditableDetailInputsByField = (field) =>
    Array.from(document.querySelectorAll(`input[data-field="${field}"][data-detail-id]`))
      .filter((input) => input.dataset.editable === 'true' && !input.disabled);

  const findEditableDetailInput = (detailId, field) => {
    const selector = `input[data-detail-id="${detailId}"][data-field="${field}"]`;
    const input = Array.from(document.querySelectorAll(selector))
      .find((node) => node.dataset.editable === 'true' && !node.disabled);
    return input || null;
  };

  const handleDetailInputKeyDown = (e) => {
    const target = e.target;
    if (target.tagName !== 'INPUT' || !target.dataset.field || !target.dataset.detailId) return;

    const field = target.dataset.field;
    const detailId = target.dataset.detailId;

    if (e.key === 'Tab') {
      if (!detailTabFields.includes(field)) return;
      e.preventDefault();

      const currentFieldIndex = detailTabFields.indexOf(field);
      const nextFieldIndex = e.shiftKey ? currentFieldIndex - 1 : currentFieldIndex + 1;

      if (nextFieldIndex >= 0 && nextFieldIndex < detailTabFields.length) {
        focusAndSelectInput(findEditableDetailInput(detailId, detailTabFields[nextFieldIndex]));
        return;
      }

      const nameInputs = getEditableDetailInputsByField('name');
      const rowIndex = nameInputs.findIndex((input) => input.dataset.detailId === detailId);
      if (rowIndex === -1) return;

      const targetRowIndex = e.shiftKey ? rowIndex - 1 : rowIndex + 1;
      if (targetRowIndex < 0 || targetRowIndex >= nameInputs.length) return;

      const nextDetailId = nameInputs[targetRowIndex]?.dataset.detailId;
      if (!nextDetailId) return;

      const edgeField = e.shiftKey ? detailTabFields[detailTabFields.length - 1] : detailTabFields[0];
      focusAndSelectInput(findEditableDetailInput(nextDetailId, edgeField));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        const entryId = target.dataset.entryId;
        if (!entryId || !addDetailRow || target.dataset.editable !== 'true' || !isVersionEditable) return;
        addDetailRow(entryId, { afterDetailId: detailId }).then((created) => {
          const createdId = created?.id;
          window.setTimeout(() => {
            if (createdId != null) {
              const createdInput = findEditableDetailInput(String(createdId), field);
              if (createdInput) {
                focusAndSelectInput(createdInput);
                return;
              }
            }
            const fallbackByField = getEditableDetailInputsByField(field);
            const fallbackCurrentIndex = fallbackByField.indexOf(target);
            if (fallbackCurrentIndex >= 0 && fallbackCurrentIndex < fallbackByField.length - 1) {
              focusAndSelectInput(fallbackByField[fallbackCurrentIndex + 1]);
              return;
            }
            const fallbackByName = getEditableDetailInputsByField('name');
            const sameEntryInput = fallbackByName.find((input) => input.dataset.entryId === String(entryId));
            focusAndSelectInput(sameEntryInput || fallbackByName[fallbackByName.length - 1]);
          }, 80);
        });
        return;
      }

      const inputs = getEditableDetailInputsByField(field);
      const currentIndex = inputs.indexOf(target);
      if (currentIndex === -1) return;

      if (currentIndex < inputs.length - 1) {
        focusAndSelectInput(inputs[currentIndex + 1]);
      }
    }
  };

  const handleTableKeyDown = (e) => {
    if (!['ArrowUp', 'ArrowDown'].includes(e.key)) return;

    const target = e.target;
    if (target.tagName !== 'INPUT' || !target.dataset.field) return;

    const field = target.dataset.field;
    const inputs = Array.from(document.querySelectorAll(`input[data-field="${field}"]`));
    const currentIndex = inputs.indexOf(target);

    if (currentIndex === -1) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex > 0) {
        inputs[currentIndex - 1].focus();
        inputs[currentIndex - 1].select();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
        inputs[currentIndex + 1].select();
      }
    }
  };

  const isDummy = Object.keys(tree).length === 1 && Object.keys(tree)[0] === 'dummy-jang';

  return (
    <div style={{ ...sheetContainer, borderTopLeftRadius: 0, ...(isDummy ? { minHeight: '420px' } : {}) }}>
      {/* 빈 상태 안내 */}
      {Object.keys(tree).length === 0 && (
        <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            {showCombinedTypeView ? '📊' : (viewType === 'income' ? '📥' : '📤')}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#334155' }}>
              {showCombinedTypeView ? '수입/지출 예산 항목이 없습니다' : `${viewType === 'income' ? '수입' : '지출'} 예산 항목이 없습니다`}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              상단의 <strong>항목 추가</strong> 버튼으로 예산 목을 추가해 주세요.
            </p>
          </div>
          {isVersionEditable && (
            <button
              style={{ ...btnPlus, padding: '8px 18px', fontSize: '12px', gap: 6, alignItems: 'center', display: 'flex', marginTop: 4 }}
              onClick={() => setIsAddOpen(true)}
            >
              <Plus size={13} /> 항목 추가
            </button>
          )}
        </div>
      )}
      {Object.keys(tree).length > 0 && (
        <div style={{ position: 'relative', ...(isDummy ? { minHeight: '400px' } : {}) }}>
          {isDummy && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              background: 'rgba(255, 255, 255, 0.95)', padding: '32px 48px', borderRadius: '16px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)', textAlign: 'center', pointerEvents: 'none',
              border: '1px solid #e2e8f0', zIndex: 10, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '12px', minWidth: '360px'
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 4
              }}>
                💡
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>안내를 위한 가상 데이터입니다</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                실제 예산 데이터를 확인하거나 입력하시려면<br />
                상단의 <strong>"적용 회차"</strong>와 <strong>"부서"</strong>를 선택하여<br />데이터를 불러와주세요.
              </p>
            </div>
          )}

          <table onKeyDown={handleTableKeyDown} style={{ ...sheetTable, ...(isDummy ? { filter: 'grayscale(1)', opacity: 0.35, pointerEvents: 'none', userSelect: 'none' } : {}) }}>
            <colgroup>
              <col style={{ width: '8%', ...hCol('jang') }} />
              <col style={{ width: '8%', ...hCol('gwan') }} />
              <col style={{ width: '8%', ...hCol('hang') }} />
              <col style={{ width: '12%', ...hCol('mok') }} />
              <col style={{ width: '7%', ...hCol('budget') }} />
              {showTransferColumns && <col style={{ width: '7%', ...hCol('base') }} />}
              {showTransferColumns && <col style={{ width: '7%', ...hCol('diff') }} />}
              <col style={{ width: '25%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '2.4%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '2.4%' }} />
              <col style={{ width: '3%' }} />
              <col style={{ width: '2.6%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '1.6%' }} />
            </colgroup>
            <thead>
              <tr style={{ height: 40 }}>
                <th
                  style={{ ...thStyle, background: '#f0f4fa', ...clickableHeaderStyle, ...hCell('jang') }}
                  {...headerClickProps('jang', '장')}
                >
                  장 (사업명)
                </th>
                <th
                  style={{ ...thStyle, background: '#f0f4fa', ...clickableHeaderStyle, ...hCell('gwan') }}
                  {...headerClickProps('gwan', '관')}
                >
                  관
                </th>
                <th
                  style={{ ...thStyle, background: '#f0f4fa', ...clickableHeaderStyle, ...hCell('hang') }}
                  {...headerClickProps('hang', '항')}
                >
                  항
                </th>
                <th
                  style={{ ...thStyle, background: '#f0f4fa', ...clickableHeaderStyle, ...hCell('mok') }}
                  {...headerClickProps('mok', '목')}
                >
                  목
                </th>
                <th
                  style={{ ...thNum, background: '#f0f4fa', ...clickableHeaderStyle, ...hCell('budget') }}
                  {...headerClickProps('budget', '예산액')}
                >
                  예산액(천원)
                </th>
                {showTransferColumns && (
                  <th
                    style={{ ...thNum, background: '#f0fdf4', color: '#065f46', ...clickableHeaderStyle, ...hCell('base') }}
                    {...headerClickProps('base', '당초 예산액')}
                  >
                    당초 예산액(천원)
                  </th>
                )}
                {showTransferColumns && (
                  <th
                    style={{ ...thNum, background: '#eff6ff', color: '#1e40af', ...clickableHeaderStyle, ...hCell('diff') }}
                    {...headerClickProps('diff', '증감액')}
                  >
                    증감액(천원)
                  </th>
                )}
                <th style={{ ...thCalcMerged, background: '#f0f4fa', borderRight: 'none' }} colSpan={9}>
                  산출내역 및 근거 &nbsp;
                  <span style={{ fontSize: '10px', fontWeight: 500, color: '#94a3b8' }}>( 항목명 · 단가 × 수량 × 빈도 = 소계 )</span>
                </th>
              </tr>
            </thead>
            {Object.entries(tree)
              .sort((a, b) => (a[1].obj?.sort_order || 0) - (b[1].obj?.sort_order || 0))
              .map(([jangKey, jang], ji, jangArr) => {
                const gwanList = Object.entries(jang.children).sort((a, b) => (a[1].obj?.sort_order || 0) - (b[1].obj?.sort_order || 0));
                // jangKey 형식: "j-{jangId}-p-{projectId}" (과제) 또는 "j-{jangId}" / "org-{orgId}"
                const pMatch = jangKey.match(/p-(\d+)$/);
                const isProj = !!pMatch;
                const pId = pMatch ? Number(pMatch[1]) : null;
                const jangUnresolvedTypesSet = (() => {
                  if (commentUnresolvedLoaded) {
                    if (jang.obj?.id) {
                      return new Set(resolveSubjectUnresolvedTypes(jang.obj.id));
                    }
                    return new Set(resolveRootUnresolvedTypes());
                  }
                  const gwanHangList = gwanList.flatMap(([, gwan]) => Object.values(gwan.children || {}));
                  return collectUnresolvedTypesFromHangList(gwanHangList, resolveEntryUnresolvedTypes);
                })();
                const jangCommentTarget = {
                  subjectId: jang.obj?.id ?? null,
                  orgId: selectedScopeOrgId,
                  projectId: pId,
                  label: `장 - ${jang.name}`,
                };
                const handleOpenJangComment = (openHierarchyCommentPanel && selectedScopeOrgId)
                  ? () => openHierarchyCommentPanel(jangCommentTarget)
                  : null;
                const isLastJangInList = ji === jangArr.length - 1;
                const b = (base, hide) => hide ? { ...base, borderBottom: 'none' } : base;
                const t = (base, show) => show ? { ...base, borderTop: '1px solid #e2e8f0' } : base;

                return (
                  <React.Fragment key={jang.name}>
                    {gwanList.map(([, gwan], gi) => {
                      const hangList = Object.values(gwan.children).sort((a, b) => (a.obj?.sort_order || 0) - (b.obj?.sort_order || 0));
                      const gwanUnresolvedTypesSet = commentUnresolvedLoaded
                        ? new Set(resolveSubjectUnresolvedTypes(gwan.obj?.id))
                        : collectUnresolvedTypesFromHangList(hangList, resolveEntryUnresolvedTypes);
                      const gwanCommentTarget = {
                        subjectId: gwan.obj?.id ?? null,
                        orgId: selectedScopeOrgId,
                        projectId: pId,
                        label: `관 - ${jang.name} > ${gwan.obj?.name || '관 미지정'}`,
                      };
                      const handleOpenGwanComment = (openHierarchyCommentPanel && gwan.obj?.id)
                        ? () => openHierarchyCommentPanel(gwanCommentTarget)
                        : null;
                      const isLastGwanInList = gi === gwanList.length - 1;

                      return (
                        <React.Fragment key={gi}>
                          <tbody>
                            <tr style={rowGwan}>
                              {/* Jang column: only top border if it's the very first row of Jang */}
                              <td style={{ ...t(b(tdSpanned, !(isLastJangInList && isLastGwanInList && hangList.length === 0)), gi === 0), ...hCell('jang') }}>
                                {gi === 0 ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {/* 수탁사업명(과제명) 인라인 편집 */}
                                    {isProj && isVersionEditable && editingProjectId === pId ? (
                                      <>
                                        <input
                                          autoFocus
                                          value={editingProjectName}
                                          onChange={e => setEditingProjectName(e.target.value)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') saveProjectName(pId);
                                            if (e.key === 'Escape') cancelEditProjectName();
                                          }}
                                          style={{ fontSize: 11, fontWeight: 700, border: '1.5px solid #2563eb', borderRadius: 4, padding: '2px 6px', outline: 'none', minWidth: 60, maxWidth: 120 }}
                                        />
                                        <button
                                          onClick={() => saveProjectName(pId)}
                                          disabled={savingProjectId === pId}
                                          style={{ fontSize: 10, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}
                                        >
                                          {savingProjectId === pId ? '…' : '저장'}
                                        </button>
                                        <button
                                          onClick={cancelEditProjectName}
                                          style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}
                                        >
                                          취소
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <span
                                          title={isProj && isVersionEditable ? '클릭하여 수탁사업명 수정' : undefined}
                                          style={isProj && isVersionEditable ? { cursor: 'text', borderBottom: '1px dashed #94a3b8' } : undefined}
                                          onClick={isProj && isVersionEditable ? () => startEditProjectName(pId, jang.name) : undefined}
                                        >
                                          {jang.name}
                                        </span>
                                        {renderHierarchyUnresolvedIcons(jangUnresolvedTypesSet, handleOpenJangComment)}
                                        {/* Supporting docs warning for jang level */}
                                        {jang.obj && Number(jang.obj.level) === 1 && !supportingDocsSubjectIds?.has(Number(jang.obj.id)) && (
                                          <span
                                            title="근거자료 미제출"
                                            style={{
                                              display: 'inline-flex', alignItems: 'center', gap: 2,
                                              fontSize: '10px', color: '#ea580c', fontWeight: 700,
                                              background: '#fff7ed', border: '1px solid #fed7aa',
                                              borderRadius: 4, padding: '1px 5px', marginLeft: 4,
                                              cursor: 'default',
                                              verticalAlign: 'middle',
                                              lineHeight: 1,
                                            }}
                                          >
                                            <Paperclip size={10} />
                                            <AlertTriangle size={9} />
                                          </span>
                                        )}
                                        {jang.obj && (
                                          <div
                                            ref={el => { if (el) hierarchyActionRefs.current[`jang-${jang.obj.id}`] = el; }}
                                            style={SUBJECT_ACTION_WRAP}
                                          >
                                            <button
                                              type="button"
                                              style={{ ...mokActionTrigger, opacity: 0.5, transition: 'opacity .2s', ...(getSubjectDragStyle(jang.obj) || {}) }}
                                              title="이동 지점의 아래로 항목의 이동합니다."
                                              {...getSubjectDragProps(jang.obj)}
                                              onClick={(event) => {
                                                if (openHierarchyActionId === `jang-${jang.obj.id}`) {
                                                  closeHierarchyAction();
                                                  return;
                                                }
                                                openHierarchyAction(`jang-${jang.obj.id}`, event.currentTarget, jangCommentTarget);
                                              }}
                                            >
                                              <MoreHorizontal size={11} />
                                            </button>
                                            {/* Move Buttons */}
                                            {isVersionEditable && (
                                              <div style={SUBJECT_MOVE_BUTTONS}>
                                                <button type="button" onClick={() => handleSubjectMove(jang.obj, 'up')} style={SUBJECT_MOVE_BUTTON} title="위로"><ArrowUp size={8} strokeWidth={2.2} /></button>
                                                <button type="button" onClick={() => handleSubjectMove(jang.obj, 'down')} style={SUBJECT_MOVE_BUTTON} title="아래로"><ArrowDown size={8} strokeWidth={2.2} /></button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ) : ''}
                              </td>
                              {/* Gwan: Always top-border since this IS rowGwan */}
                              <td style={{ ...t(b(tdBase, hangList.length > 0), true), ...hCell('gwan') }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span>{gwan.obj?.name || '관 미지정'}</span>
                                  {renderHierarchyUnresolvedIcons(gwanUnresolvedTypesSet, handleOpenGwanComment)}
                                  {gwan.obj && (
                                    <div
                                      ref={el => { if (el) hierarchyActionRefs.current[`gwan-${gwan.obj.id}`] = el; }}
                                      style={SUBJECT_ACTION_WRAP}
                                    >
                                      <button
                                        type="button"
                                        style={{ ...mokActionTrigger, opacity: 0.5, transition: 'opacity .2s', ...(getSubjectDragStyle(gwan.obj) || {}) }}
                                        title="이동 지점의 아래로 항목의 이동합니다."
                                        {...getSubjectDragProps(gwan.obj)}
                                        onClick={(event) => {
                                          if (openHierarchyActionId === `gwan-${gwan.obj.id}`) {
                                            closeHierarchyAction();
                                            return;
                                          }
                                          openHierarchyAction(`gwan-${gwan.obj.id}`, event.currentTarget, { subjectId: gwan.obj.id, orgId: selectedScopeOrgId, projectId: pId, label: `관 - ${jang.name} > ${gwan.obj?.name || '관 미지정'}` });
                                        }}
                                      >
                                        <MoreHorizontal size={11} />
                                      </button>
                                      {/* Move Buttons */}
                                      {isVersionEditable && (
                                        <div style={SUBJECT_MOVE_BUTTONS}>
                                          <button type="button" onClick={() => handleSubjectMove(gwan.obj, 'up')} style={SUBJECT_MOVE_BUTTON} title="위로"><ArrowUp size={8} strokeWidth={2.2} /></button>
                                          <button type="button" onClick={() => handleSubjectMove(gwan.obj, 'down')} style={SUBJECT_MOVE_BUTTON} title="아래로"><ArrowDown size={8} strokeWidth={2.2} /></button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ ...t(b({ ...tdBase, color: '#94a3b8', fontSize: '11px' }, true), true), ...hCell('hang') }}>
                                {(() => {
                                  return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span>관 소계</span>
                                    </div>
                                  );
                                })()}
                              </td>
                              <td style={{ ...t(b(tdBase, true), true), ...hCell('mok') }} />
                              <td style={{ ...t(b({ ...tdAmtSum, fontWeight: 700 }, true), true), ...hCell('budget') }}>{numInThousand(gwan.total)}</td>
                              {showTransferColumns && (
                                <td style={{ ...t(b({ ...tdAmtSum, fontWeight: 700, color: '#065f46' }, true), true), ...hCell('base') }}>{numInThousand(gwan.lastTotal)}</td>
                              )}
                              {showTransferColumns && (() => {
                                const gwanDiff = Number(gwan.total || 0) - Number(gwan.lastTotal || 0); return (
                                  <td style={{ ...t(b({ ...tdAmtSum, fontWeight: 700, color: varianceColor(gwanDiff), background: varianceBg(gwanDiff) }, true), true), ...hCell('diff') }}>{varianceNumInThousand(gwanDiff)}</td>
                                );
                              })()}
                              <td style={t(tdCalcBase, true)} />
                              <td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} />
                              <td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} />
                            </tr>
                          </tbody>
                          {hangList.map((hang, hi) => {
                            const moks = [...hang.moks].sort((a, b) => (a.mok?.sort_order || 0) - (b.mok?.sort_order || 0));
                            const hangUnresolvedTypesSet = commentUnresolvedLoaded
                              ? new Set(resolveSubjectUnresolvedTypes(hang.obj?.id))
                              : collectUnresolvedTypesFromMoks(moks, resolveEntryUnresolvedTypes);
                            const hangCommentTarget = {
                              subjectId: hang.obj?.id ?? null,
                              orgId: selectedScopeOrgId,
                              projectId: pId,
                              label: `항 - ${jang.name} > ${gwan.obj?.name || '관 미지정'} > ${hang.obj?.name || '항 미지정'}`,
                            };
                            const handleOpenHangComment = (openHierarchyCommentPanel && hang.obj?.id)
                              ? () => openHierarchyCommentPanel(hangCommentTarget)
                              : null;
                            const isLastHangInList = hi === hangList.length - 1;

                            return (
                              <React.Fragment key={hi}>
                                <tbody>
                                  <tr style={rowHang}>
                                    {/* Jang, Gwan: Continuing, so no top border */}
                                    <td style={{ ...t(b(tdEmpty, !(isLastJangInList && isLastGwanInList && isLastHangInList && moks.length === 0)), false), ...hCell('jang') }} />
                                    <td style={{ ...t(b(tdBase, !(isLastGwanInList && isLastHangInList && moks.length === 0)), false), ...hCell('gwan') }} />
                                    {/* Hang: Starts here, top-border true */}
                                    <td style={{ ...t(b(tdBase, moks.length > 0), true), ...hCell('hang') }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span>{hang.obj?.name || '항 미지정'}</span>
                                        {renderHierarchyUnresolvedIcons(hangUnresolvedTypesSet, handleOpenHangComment)}
                                        {hang.obj && (
                                          <div
                                            ref={el => { if (el) hierarchyActionRefs.current[`hang-${hang.obj.id}`] = el; }}
                                            style={SUBJECT_ACTION_WRAP}
                                          >
                                            <button
                                              type="button"
                                              style={{ ...mokActionTrigger, opacity: 0.5, transition: 'opacity .2s', ...(getSubjectDragStyle(hang.obj) || {}) }}
                                              title="이동 지점의 아래로 항목의 이동합니다."
                                              {...getSubjectDragProps(hang.obj)}
                                              onClick={(event) => {
                                                if (openHierarchyActionId === `hang-${hang.obj.id}`) {
                                                  closeHierarchyAction();
                                                  return;
                                                }
                                                openHierarchyAction(`hang-${hang.obj.id}`, event.currentTarget, { subjectId: hang.obj.id, orgId: selectedScopeOrgId, projectId: pId, label: `항 - ${jang.name} > ${gwan.obj?.name || '관 미지정'} > ${hang.obj?.name || '항 미지정'}` });
                                              }}
                                            >
                                              <MoreHorizontal size={11} />
                                            </button>
                                            {/* Move Buttons */}
                                            {isVersionEditable && (
                                              <div style={SUBJECT_MOVE_BUTTONS}>
                                                <button type="button" onClick={() => handleSubjectMove(hang.obj, 'up')} style={SUBJECT_MOVE_BUTTON} title="위로"><ArrowUp size={8} strokeWidth={2.2} /></button>
                                                <button type="button" onClick={() => handleSubjectMove(hang.obj, 'down')} style={SUBJECT_MOVE_BUTTON} title="아래로"><ArrowDown size={8} strokeWidth={2.2} /></button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td style={{ ...t(b({ ...tdBase, color: '#94a3b8', fontSize: '11px' }, true), true), ...hCell('mok') }}>
                                      {(() => {
                                        return (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <span>항 소계</span>
                                          </div>
                                        );
                                      })()}
                                    </td>
                                    <td style={{ ...t(b({ ...tdAmtSum, fontWeight: 700 }, true), true), ...hCell('budget') }}>{numInThousand(hang.total)}</td>
                                    {showTransferColumns && (
                                      <td style={{ ...t(b({ ...tdAmtSum, fontWeight: 700, color: '#065f46' }, true), true), ...hCell('base') }}>{numInThousand(hang.lastTotal)}</td>
                                    )}
                                    {showTransferColumns && (() => {
                                      const hangDiff = Number(hang.total || 0) - Number(hang.lastTotal || 0); return (
                                        <td style={{ ...t(b({ ...tdAmtSum, fontWeight: 700, color: varianceColor(hangDiff), background: varianceBg(hangDiff) }, true), true), ...hCell('diff') }}>{varianceNumInThousand(hangDiff)}</td>
                                      );
                                    })()}
                                    <td style={t(tdCalcBase, true)} />
                                    <td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} />
                                    <td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} /><td style={t(tdBlank, true)} />
                                  </tr>
                                </tbody>
                                {moks.map(({ mok, entries }, mi) => {
                                  const isLastMokInList = mi === moks.length - 1;

                                  const renderRows = [];
                                  entries.forEach((e) => {
                                    const ds = [...(e.details || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                                    if (ds.length === 0) {
                                      renderRows.push({ entry: e, detail: null, isFirstInEntry: true });
                                    } else {
                                      ds.forEach((d, di) => {
                                        renderRows.push({ entry: e, detail: d, isFirstInEntry: di === 0 });
                                      });
                                    }
                                  });

                                  const combinedMokTotal = entries.reduce((sum, e) => sum + (e.total_amount_calc || 0), 0);
                                  const combinedMokBaseTotal = entries.reduce((sum, e) => sum + Number(e.last_year_amount || 0), 0);
                                  const combinedMokDiffTotal = Number(combinedMokTotal || 0) - Number(combinedMokBaseTotal || 0);

                                  return (
                                    <tbody key={mok.id || mi}>
                                      {renderRows.map((row, ri) => {
                                        const { entry: e, detail: d, isFirstInEntry } = row;
                                        const isLastRowInMok = ri === renderRows.length - 1;
                                        const editable = e.status === 'DRAFT';
                                        const eUnresolvedTypes = resolveEntryUnresolvedTypes(e);
                                        const hasEntryFlowInfo = eUnresolvedTypes.includes('REQUEST') || eUnresolvedTypes.includes('QUESTION');

                                        const isVeryLastOfHang = isLastHangInList && isLastMokInList && isLastRowInMok;
                                        const isVeryLastOfGwan = isLastGwanInList && isVeryLastOfHang;
                                        const isVeryLastOfJang = isLastJangInList && isVeryLastOfGwan;

                                        const tdLabelStyle = ri === 0
                                          ? (!d && renderRows.length === 1 ? tdMokLabelAction : tdMokLabelActionCompact)
                                          : tdBase;

                                        const tdAmtStyle = ri === 0
                                          ? (!d && renderRows.length === 1 ? { ...tdAmtMok, color: '#94a3b8' } : tdAmtMokCompact)
                                          : tdBudgetBlank;

                                        return (
                                          <tr key={d ? d.id : `empty-${e.id}`} style={d ? rowDetail : { ...rowMok, background: getMokRowBg(e) }}>
                                            <td style={{ ...t(b(tdEmpty, !isVeryLastOfJang), false), ...hCell('jang') }} />
                                            <td style={{ ...t(b(tdEmpty, !isVeryLastOfGwan), false), ...hCell('gwan') }} />
                                            <td style={{ ...t(b(tdEmpty, !isVeryLastOfHang), false), ...hCell('hang') }} />
                                            <td style={{ ...t(b(tdLabelStyle, !isLastRowInMok), ri === 0), ...hCell('mok') }}>
                                              {ri === 0 && (
                                                <div style={mokCellWrap}>
                                                  <div style={mokInlineHead}>
                                                    <span style={mokNameText} title={mok.name}>{mok.name}</span>
                                                    {renderMokActions(entries[0].id, {
                                                      dragProps: getSubjectDragProps(mok),
                                                      dragStyle: getSubjectDragStyle(mok),
                                                    })}
                                                    {isVersionEditable && (
                                                      <div style={{ ...SUBJECT_MOVE_BUTTONS, marginLeft: 6, marginRight: 2 }}>
                                                        <button type="button" onClick={() => handleSubjectMove(mok, 'up')} style={SUBJECT_MOVE_BUTTON} title="위로"><ArrowUp size={8} strokeWidth={2.2} /></button>
                                                        <button type="button" onClick={() => handleSubjectMove(mok, 'down')} style={SUBJECT_MOVE_BUTTON} title="아래로"><ArrowDown size={8} strokeWidth={2.2} /></button>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                              {isFirstInEntry && hasEntryFlowInfo && (
                                                <div style={{ ...mokCellWrap, marginLeft: ri === 0 ? 4 : 0 }}>
                                                  <EntryFlowInfo entry={e} unresolvedTypes={eUnresolvedTypes} onToggleComment={handleToggleCommentEntry} />
                                                </div>
                                              )}
                                            </td>
                                            <td style={{ ...t(b(tdAmtStyle, !isLastRowInMok), ri === 0), ...hCell('budget') }}>
                                              {ri === 0 ? (!d && renderRows.length === 1 ? '—' : numInThousand(combinedMokTotal)) : ''}
                                            </td>
                                            {showTransferColumns && (
                                              <td style={{ ...t(b({ ...tdAmtStyle, color: ri === 0 ? '#065f46' : undefined }, !isLastRowInMok), ri === 0), ...hCell('base') }}>
                                                {ri === 0 ? (!d && renderRows.length === 1 ? '—' : numInThousand(combinedMokBaseTotal)) : ''}
                                              </td>
                                            )}
                                            {showTransferColumns && (
                                              <td style={{ ...t(b({ ...tdAmtStyle, color: ri === 0 ? varianceColor(combinedMokDiffTotal) : undefined, background: ri === 0 ? varianceBg(combinedMokDiffTotal) : undefined }, !isLastRowInMok), ri === 0), ...hCell('diff') }}>
                                                {ri === 0 ? (!d && renderRows.length === 1 ? '—' : varianceNumInThousand(combinedMokDiffTotal)) : ''}
                                              </td>
                                            )}

                                            {!d ? (
                                              <td style={t({ ...tdCalcBase, borderRight: 'none' }, ri === 0)} colSpan={9}>
                                                {editable ? (
                                                  <button
                                                    type="button"
                                                    onClick={() => addDetailRow(e.id)}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '10px', color: '#3b82f6', background: 'none', border: '1px dashed #bfdbfe', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 600 }}
                                                  >
                                                    <Plus size={10} /> 산출근거 추가
                                                  </button>
                                                ) : (
                                                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>산출근거 없음</span>
                                                )}
                                              </td>
                                            ) : (
                                              <>
                                                <td style={t(tdCalcNameCell, ri === 0)}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <button
                                                      type="button"
                                                      title="이 산출근거 삭제"
                                                      onClick={() => deleteDetail(d.id)}
                                                      style={{ flexShrink: 0, width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 0, borderRadius: 4, opacity: deletingDetailId === d.id ? 0.3 : 0.7 }}
                                                    >
                                                      <X size={10} />
                                                    </button>
                                                    <input
                                                      name={`detail_name_${d.id}`}
                                                      data-field="name"
                                                      data-detail-id={d.id}
                                                      data-entry-id={e.id}
                                                      data-last-row={isLastRowInMok ? 'true' : 'false'}
                                                      data-editable={editable ? 'true' : 'false'}
                                                      onKeyDown={handleDetailInputKeyDown}
                                                      style={fName}
                                                      value={localDetails[d.id]?.name ?? d.name}
                                                      disabled={!editable}
                                                      placeholder="항목명 입력"
                                                      onChange={v => updateLocalDetail(d.id, { name: v.target.value })}
                                                      onBlur={v => flushAutoSave(d.id, { name: v.target.value })}
                                                    />
                                                  </div>
                                                </td>
                                                <td style={t({ ...tdCalcPriceCell }, ri === 0)}>
                                                  <AutoResizeInput name={`detail_price_${d.id}`} style={fPrice} isNumber={true} value={localDetails[d.id]?.price ?? d.price}
                                                    disabled={!editable}
                                                    onKeyDown={handleDetailInputKeyDown}
                                                    data-field="price"
                                                    data-detail-id={d.id}
                                                    data-entry-id={e.id}
                                                    data-last-row={isLastRowInMok ? 'true' : 'false'}
                                                    data-editable={editable ? 'true' : 'false'}
                                                    onChange={val => updateLocalDetail(d.id, { price: val })}
                                                    onBlur={val => flushAutoSave(d.id, { price: val })}
                                                  />
                                                </td>
                                                <td style={t(tdCalcUnitOpCell, ri === 0)}>
                                                  <div style={formulaUnitOpWrap}>
                                                    <AutoResizeInput
                                                      name={`detail_currency_unit_${d.id}`}
                                                      style={{ ...fUnit, color: '#94a3b8' }}
                                                      value={localDetails[d.id]?.currency_unit ?? d.currency_unit ?? '원'}
                                                      disabled={!editable}
                                                      onKeyDown={handleDetailInputKeyDown}
                                                      data-field="currency_unit"
                                                      data-detail-id={d.id}
                                                      data-entry-id={e.id}
                                                      data-last-row={isLastRowInMok ? 'true' : 'false'}
                                                      data-editable={editable ? 'true' : 'false'}
                                                      onChange={val => updateLocalDetail(d.id, { currency_unit: val })}
                                                      onBlur={val => flushAutoSave(d.id, { currency_unit: val || '원' })}
                                                    />
                                                    <span style={formulaOperator}>×</span>
                                                  </div>
                                                </td>
                                                <td style={t(tdCalcQtyCell, ri === 0)}>
                                                  <AutoResizeInput name={`detail_qty_${d.id}`} style={fQty} isNumber={true} value={localDetails[d.id]?.qty ?? d.qty}
                                                    disabled={!editable}
                                                    onKeyDown={handleDetailInputKeyDown}
                                                    data-field="qty"
                                                    data-detail-id={d.id}
                                                    data-entry-id={e.id}
                                                    data-last-row={isLastRowInMok ? 'true' : 'false'}
                                                    data-editable={editable ? 'true' : 'false'}
                                                    onChange={val => updateLocalDetail(d.id, { qty: val })}
                                                    onBlur={val => flushAutoSave(d.id, { qty: val })}
                                                  />
                                                </td>
                                                <td style={t(tdCalcUnitOpCell, ri === 0)}>
                                                  <div style={formulaUnitOpWrap}>
                                                    <AutoResizeInput
                                                      name={`detail_unit_${d.id}`}
                                                      style={{ ...fUnit, color: '#94a3b8' }}
                                                      value={localDetails[d.id]?.unit ?? d.unit ?? '식'}
                                                      disabled={!editable}
                                                      onKeyDown={handleDetailInputKeyDown}
                                                      data-field="unit"
                                                      data-detail-id={d.id}
                                                      data-entry-id={e.id}
                                                      data-last-row={isLastRowInMok ? 'true' : 'false'}
                                                      data-editable={editable ? 'true' : 'false'}
                                                      onChange={val => updateLocalDetail(d.id, { unit: val })}
                                                      onBlur={val => flushAutoSave(d.id, { unit: val || '식' })}
                                                    />
                                                    <span style={formulaOperator}>×</span>
                                                  </div>
                                                </td>
                                                <td style={t(tdCalcQtyCell, ri === 0)}>
                                                  <AutoResizeInput name={`detail_freq_${d.id}`} style={fFreq} isNumber={true} value={localDetails[d.id]?.freq ?? d.freq}
                                                    disabled={!editable}
                                                    onKeyDown={handleDetailInputKeyDown}
                                                    data-field="freq"
                                                    data-detail-id={d.id}
                                                    data-entry-id={e.id}
                                                    data-last-row={isLastRowInMok ? 'true' : 'false'}
                                                    data-editable={editable ? 'true' : 'false'}
                                                    onChange={val => updateLocalDetail(d.id, { freq: val })}
                                                    onBlur={val => flushAutoSave(d.id, { freq: val })}
                                                  />
                                                </td>
                                                <td style={t(tdCalcUnitOpCell, ri === 0)}>
                                                  <div style={formulaUnitOpWrap}>
                                                    <AutoResizeInput
                                                      name={`detail_freq_unit_${d.id}`}
                                                      style={{ ...fUnit, color: '#94a3b8' }}
                                                      value={localDetails[d.id]?.freq_unit ?? d.freq_unit ?? '회'}
                                                      disabled={!editable}
                                                      onKeyDown={handleDetailInputKeyDown}
                                                      data-field="freq_unit"
                                                      data-detail-id={d.id}
                                                      data-entry-id={e.id}
                                                      data-last-row={isLastRowInMok ? 'true' : 'false'}
                                                      data-editable={editable ? 'true' : 'false'}
                                                      onChange={val => updateLocalDetail(d.id, { freq_unit: val })}
                                                      onBlur={val => flushAutoSave(d.id, { freq_unit: val || '회' })}
                                                    />
                                                    <span style={{ ...formulaOperator, color: '#0f172a', fontWeight: 800 }}>=</span>
                                                  </div>
                                                </td>
                                                <td style={t(tdCalcAmountCell, ri === 0)}>
                                                  <span style={{ fontWeight: 800 }}>{num((localDetails[d.id]?.price ?? d.price) * (localDetails[d.id]?.qty ?? d.qty) * (localDetails[d.id]?.freq ?? d.freq))}</span>
                                                  <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 2 }}>원</span>
                                                </td>
                                                <td style={t(tdBlank, ri === 0)} />
                                              </>
                                            )}
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
          </table>
        </div >
      )}
      <style>{`
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      <div style={tableBottomPad} />
    </div >
  );
}

