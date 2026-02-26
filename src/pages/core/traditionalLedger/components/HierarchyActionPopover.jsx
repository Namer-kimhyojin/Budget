import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, MessageSquare, Plus, Trash2, FileText, Check } from 'lucide-react';
import { bubbleActionBtn, bubbleActionBtnDanger, bubbleActionBtnInfo, mokActionPopover } from '../styles';

const EDGE = 8;
const POP_GAP = 6;
const BASE_PANEL_WIDTH = 200;
const STEP_WIDTH = 240;
const STEP_WIDTH_WIDE = 440;

function StepPanel({ title, stepNum, children, isActive, onGoBack, showBackButton, isDense }) {
  const w = isDense ? STEP_WIDTH_WIDE : STEP_WIDTH;
  return (
    <div style={{
      ...mokActionPopover,
      width: w, minWidth: w, flexShrink: 0,
      padding: 0, display: 'flex', flexDirection: 'column',
      maxHeight: 'calc(100vh - 24px)',
      overflow: 'hidden',
      border: isActive ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
      boxShadow: isActive ? '0 0 0 3px rgba(59,130,246,0.08), 0 4px 12px rgba(0,0,0,0.08)' : '0 4px 12px rgba(0,0,0,0.06)',
    }}>
      {/* Step header */}
      <div style={{
        padding: '8px 12px',
        background: isActive ? '#eff6ff' : '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, borderRadius: '50%', fontSize: '10px', fontWeight: 800,
            background: isActive ? '#2563eb' : '#cbd5e1',
            color: '#fff',
          }}>
            {stepNum}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#1d4ed8' : '#64748b' }}>
            {title}
          </span>
        </div>
        {showBackButton && (
          <button
            type="button"
            onClick={onGoBack}
            style={{
              background: 'none', border: 'none', fontSize: '11px',
              color: '#64748b', cursor: 'pointer', padding: '2px 6px',
              borderRadius: 4, fontWeight: 600,
            }}
            onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'none'; }}
          >
            ← 이전
          </button>
        )}
      </div>
      {/* Content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '6px 6px',
      }}>
        {children}
      </div>
    </div>
  );
}

function StepItem({ name, isSelected, isUsed, onClick, onDoubleClick }) {
  return (
    <button
      type="button"
      onClick={() => { if (!isUsed) onClick(); }}
      onDoubleClick={() => { if (!isUsed && onDoubleClick) onDoubleClick(); }}
      disabled={isUsed}
      style={{
        width: '100%', textAlign: 'left',
        padding: '7px 10px', borderRadius: 7,
        border: isSelected ? '1.5px solid #93c5fd' : '1px solid transparent',
        background: isSelected ? '#dbeafe' : isUsed ? '#f8fafc' : '#fff',
        color: isUsed ? '#94a3b8' : isSelected ? '#1d4ed8' : '#1e293b',
        fontSize: '12px', fontWeight: isSelected ? 700 : 500,
        cursor: isUsed ? 'not-allowed' : 'pointer',
        opacity: isUsed ? 0.6 : 1,
        display: 'flex', alignItems: 'center', gap: 7,
        transition: 'all 0.1s',
        lineHeight: 1.3,
      }}
      onMouseOver={e => { if (!isUsed && !isSelected) { e.currentTarget.style.background = '#f0f4ff'; e.currentTarget.style.border = '1px solid #dbeafe'; } }}
      onMouseOut={e => { if (!isUsed && !isSelected) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.border = '1px solid transparent'; } }}
    >
      {isSelected ? (
        <Check size={12} style={{ flexShrink: 0, color: '#2563eb' }} />
      ) : (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: isUsed ? '#cbd5e1' : '#94a3b8',
        }} />
      )}
      <span style={{ flex: 1, wordBreak: 'keep-all' }}>
        {name}{isUsed ? ' (추가됨)' : ''}
      </span>
      {!isUsed && !isSelected && (
        <ChevronRight size={11} style={{ flexShrink: 0, color: '#cbd5e1' }} />
      )}
    </button>
  );
}

function AddButton({ onClick, disabled, loading, label }) {
  return (
    <div style={{ padding: '6px 6px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          background: disabled ? '#f1f5f9' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: disabled ? '#94a3b8' : '#fff',
          border: 'none', fontSize: '12px', fontWeight: 700,
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          transition: 'all 0.15s',
        }}
      >
        <Plus size={13} />
        <span>{loading ? '추가 중..' : label || '선택 항목 추가'}</span>
      </button>
    </div>
  );
}

export default function HierarchyActionPopover({
  openHierarchyActionId,
  hierarchyActionAnchor,
  hierarchyActionPopoverRef,
  actionPopoverZIndex,
  isVersionEditable,
  isHierarchyAddMenuOpen,
  openHierarchyParentSubject,
  hierarchyStepOptions,
  hierarchySelectedGwanId,
  hierarchySelectedHangId,
  hierarchySelectedMokId,
  usedMokIdsInScope,
  hierarchyAddLoading,
  onToggleAddMenu,
  onDeleteSubject,
  onSelectGwan,
  onSelectHang,
  onSelectMok,
  onAddSelected,
  hierarchyCommentData,
  setCommentSubjectTarget,
  closeHierarchyAction,
  onOpenSupportingDocs,
  leafSubjectIds,
}) {
  const hasAnchor = openHierarchyActionId != null && !!hierarchyActionAnchor;
  if (!hasAnchor) return null;

  const showGwanStep = Number(hierarchyStepOptions.level) === 1;
  const showHangStep = Number(hierarchyStepOptions.level) === 2 || hierarchySelectedGwanId;
  const showMokStep = Number(hierarchyStepOptions.level) === 3 || hierarchySelectedHangId;

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const viewportLeft = window.visualViewport?.offsetLeft ?? 0;
  const viewportTop = window.visualViewport?.offsetTop ?? 0;

  // Calculate total width
  let totalWidth_ = BASE_PANEL_WIDTH;
  if (isHierarchyAddMenuOpen && openHierarchyParentSubject) {
    const isLeaf = Number(openHierarchyParentSubject.level) >= 4 || (leafSubjectIds && leafSubjectIds.has(Number(openHierarchyParentSubject.id)));
    if (!isLeaf) {
      const gwanDense = hierarchyStepOptions.gwanOptions.length > 10;
      const hangDense = hierarchyStepOptions.hangOptions.length > 10;
      const mokDense = hierarchyStepOptions.mokOptions.length > 10;
      if (showGwanStep) totalWidth_ += (gwanDense ? STEP_WIDTH_WIDE : STEP_WIDTH) + POP_GAP;
      if (showHangStep) totalWidth_ += (hangDense ? STEP_WIDTH_WIDE : STEP_WIDTH) + POP_GAP;
      if (showMokStep) totalWidth_ += (mokDense ? STEP_WIDTH_WIDE : STEP_WIDTH) + POP_GAP;
    } else {
      totalWidth_ += STEP_WIDTH + POP_GAP;
    }
  }
  const totalWidth = totalWidth_;
  const estimatedHeight = isHierarchyAddMenuOpen ? Math.min(viewportHeight - EDGE * 2, 580) : 120;

  const minLeft = viewportLeft + EDGE;
  const maxLeft = Math.max(minLeft, viewportLeft + viewportWidth - totalWidth - EDGE);
  const clampedLeft = Math.min(Math.max(hierarchyActionAnchor.left, minLeft), maxLeft);

  const minTop = viewportTop + EDGE;
  const maxTop = Math.max(minTop, viewportTop + viewportHeight - estimatedHeight - EDGE);
  const clampedTop = Math.min(Math.max(hierarchyActionAnchor.top, minTop), maxTop);

  // Determine which step is "active"
  const activeStep = showMokStep ? 3 : showHangStep ? 2 : 1;

  // Handle double-click: auto-add for mok, auto-advance for gwan/hang
  const handleGwanDoubleClick = (id) => {
    onSelectGwan(id);
    // Just select, step 2 will appear automatically
  };

  const handleHangDoubleClick = (id) => {
    onSelectHang(id);
    // Just select, step 3 will appear automatically
  };

  const handleMokDoubleClick = (id) => {
    if (usedMokIdsInScope && usedMokIdsInScope.has(Number(id))) return;
    onSelectMok(id);
    // Auto-submit after selecting mok via double-click
    setTimeout(() => onAddSelected(), 50);
  };

  // Go back handlers
  const handleBackFromHang = () => {
    onSelectGwan(''); // clear gwan => hides hang & mok
  };
  const handleBackFromMok = () => {
    onSelectHang(''); // clear hang => hides mok
  };

  return createPortal(
    <div
      ref={hierarchyActionPopoverRef}
      style={{
        position: 'fixed',
        zIndex: actionPopoverZIndex,
        top: clampedTop,
        left: clampedLeft,
        display: 'flex',
        alignItems: hierarchyActionAnchor.alignBottom ? 'flex-end' : 'flex-start',
        gap: POP_GAP,
        maxWidth: 'calc(100vw - 16px)',
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: 2,
      }}
    >
      {/* Base action panel */}
      <div style={{ ...mokActionPopover, flexShrink: 0 }}>
        <button
          type="button"
          style={{ ...bubbleActionBtn, opacity: isVersionEditable ? 1 : 0.6, cursor: isVersionEditable ? 'pointer' : 'not-allowed' }}
          disabled={!isVersionEditable}
          onClick={onToggleAddMenu}
          title="하위 항목 추가"
        >
          <Plus size={12} />
          <span>{isHierarchyAddMenuOpen ? '하위 항목 선택 닫기' : '하위 항목 추가'}</span>
        </button>
        <button
          type="button"
          style={{ ...bubbleActionBtnDanger, opacity: isVersionEditable ? 1 : 0.6, cursor: isVersionEditable ? 'pointer' : 'not-allowed' }}
          disabled={!isVersionEditable}
          onClick={onDeleteSubject}
          title="항목 삭제"
        >
          <Trash2 size={12} />
          <span>항목 삭제</span>
        </button>
        <button
          type="button"
          style={bubbleActionBtnInfo}
          onClick={() => {
            if (hierarchyCommentData && setCommentSubjectTarget) {
              setCommentSubjectTarget({ ...hierarchyCommentData });
              if (closeHierarchyAction) closeHierarchyAction();
            }
          }}
          title="댓글 보기 / 등록"
        >
          <MessageSquare size={12} />
          <span>댓글 보기</span>
        </button>
        {Number(openHierarchyParentSubject?.level) === 1 && (
          <button
            type="button"
            style={{ ...bubbleActionBtn, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
            onClick={() => onOpenSupportingDocs(openHierarchyParentSubject.id)}
            title="근거자료 제출"
          >
            <FileText size={12} />
            <span>근거자료 제출</span>
          </button>
        )}
      </div>

      {/* Step panels - expand to the right */}
      {isHierarchyAddMenuOpen && openHierarchyParentSubject && (() => {
        const isLeaf = Number(openHierarchyParentSubject.level) >= 4 || (leafSubjectIds && leafSubjectIds.has(Number(openHierarchyParentSubject.id)));

        if (isLeaf) {
          return (
            <StepPanel title={`${openHierarchyParentSubject.name}`} stepNum="!" isActive={true}>
              <div style={{ fontSize: '12px', color: '#94a3b8', padding: '12px 8px', textAlign: 'center' }}>
                최하위 항목(목)에서는 더 이상<br />하위 항목을 추가할 수 없습니다.
              </div>
            </StepPanel>
          );
        }

        const gwanDense = hierarchyStepOptions.gwanOptions.length > 10;
        const hangDense = hierarchyStepOptions.hangOptions.length > 10;
        const mokDense = hierarchyStepOptions.mokOptions.length > 10;

        return (
          <>
            {/* Step 1: 관 선택 */}
            {showGwanStep && (
              <StepPanel
                title="관 선택"
                stepNum={1}
                isActive={activeStep === 1}
                isDense={gwanDense}
              >
                {hierarchyStepOptions.gwanOptions.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: gwanDense ? 'repeat(2, 1fr)' : '1fr', gap: 2 }}>
                    {hierarchyStepOptions.gwanOptions.map(s => (
                      <StepItem
                        key={s.id}
                        name={s.name}
                        isSelected={String(hierarchySelectedGwanId) === String(s.id)}
                        isUsed={false}
                        onClick={() => onSelectGwan(s.id)}
                        onDoubleClick={() => handleGwanDoubleClick(s.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', padding: '8px', textAlign: 'center' }}>
                    선택 가능한 관이 없습니다.
                  </div>
                )}
                {/* Allow adding at Gwan level if selected */}
                {hierarchySelectedGwanId && (
                  <AddButton
                    onClick={onAddSelected}
                    disabled={!isVersionEditable || hierarchyAddLoading}
                    loading={hierarchyAddLoading}
                    label="관 단위로 추가"
                  />
                )}
              </StepPanel>
            )}

            {/* Step 2: 항 선택 */}
            {showHangStep && (
              <StepPanel
                title="항 선택"
                stepNum={2}
                isActive={activeStep === 2}
                showBackButton={showGwanStep}
                onGoBack={handleBackFromHang}
                isDense={hangDense}
              >
                {hierarchyStepOptions.hangOptions.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: hangDense ? 'repeat(2, 1fr)' : '1fr', gap: 2 }}>
                    {hierarchyStepOptions.hangOptions.map(s => (
                      <StepItem
                        key={s.id}
                        name={s.name}
                        isSelected={String(hierarchySelectedHangId) === String(s.id)}
                        isUsed={false}
                        onClick={() => onSelectHang(s.id)}
                        onDoubleClick={() => handleHangDoubleClick(s.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', padding: '8px', textAlign: 'center' }}>
                    선택 가능한 항이 없습니다.
                  </div>
                )}
                {/* Allow adding at Hang level if selected */}
                {hierarchySelectedHangId && (
                  <AddButton
                    onClick={onAddSelected}
                    disabled={!isVersionEditable || hierarchyAddLoading}
                    loading={hierarchyAddLoading}
                    label="항 단위로 추가"
                  />
                )}
              </StepPanel>
            )}

            {/* Step 3: 목 선택 */}
            {showMokStep && (
              <StepPanel
                title="목 선택"
                stepNum={3}
                isActive={activeStep === 3}
                showBackButton={true}
                onGoBack={handleBackFromMok}
                isDense={mokDense}
              >
                {hierarchyStepOptions.mokOptions.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: mokDense ? 'repeat(2, 1fr)' : '1fr', gap: 2 }}>
                    {hierarchyStepOptions.mokOptions.map(s => (
                      <StepItem
                        key={s.id}
                        name={s.name}
                        isSelected={String(hierarchySelectedMokId) === String(s.id)}
                        isUsed={usedMokIdsInScope ? usedMokIdsInScope.has(Number(s.id)) : false}
                        onClick={() => onSelectMok(s.id)}
                        onDoubleClick={() => handleMokDoubleClick(s.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#94a3b8', padding: '8px', textAlign: 'center' }}>
                    선택 가능한 목이 없습니다.
                  </div>
                )}
                <AddButton
                  onClick={onAddSelected}
                  disabled={!isVersionEditable || hierarchyAddLoading || !hierarchySelectedMokId}
                  loading={hierarchyAddLoading}
                  label="선택 항목 추가"
                />
              </StepPanel>
            )}
          </>
        );
      })()}
    </div>,
    document.body
  );
}
