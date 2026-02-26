import React from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { bubbleActionBtn, bubbleActionBtnDanger, bubbleActionBtnInfo, mokActionPopover } from '../styles';

export default function MokActionPopover({
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
  onToggleCommentEntry,
}) {
  if (openMokActionEntryId == null || !mokActionAnchor) return null;

  const editable = canEditEntry(openMokActionEntryId);
  const lockMessage = isVersionEditable ? '작성중(DRAFT) 상태에서만 수정 가능' : '대기 상태 회차에서만 수정 가능';

  return createPortal(
    <div
      ref={mokActionPopoverRef}
      style={{ ...mokActionPopover, zIndex: actionPopoverZIndex, top: mokActionAnchor.top, left: mokActionAnchor.left }}
    >
      <button
        type="button"
        style={{ ...bubbleActionBtn, opacity: editable ? 1 : 0.6, cursor: editable ? 'pointer' : 'not-allowed' }}
        onClick={() => {
          const targetId = openMokActionEntryId;
          closeMokAction();
          addDetailRow(targetId);
        }}
        disabled={!editable || addingEntryId === openMokActionEntryId}
        title={editable ? '산출근거 추가' : lockMessage}
      >
        <Plus size={12} />
        <span>{addingEntryId === openMokActionEntryId ? '추가 중...' : '산출근거 추가'}</span>
      </button>
      <button
        type="button"
        style={{ ...bubbleActionBtnDanger, opacity: editable ? 1 : 0.6, cursor: editable ? 'pointer' : 'not-allowed' }}
        onClick={() => {
          const targetId = openMokActionEntryId;
          closeMokAction();
          deleteEntry(targetId);
        }}
        disabled={!editable}
        title={editable ? '예산 항목 삭제' : lockMessage}
      >
        <Trash2 size={12} />
        <span>예산 항목 삭제</span>
      </button>
      <button
        type="button"
        style={bubbleActionBtnInfo}
        onClick={() => {
          const targetId = openMokActionEntryId;
          closeMokAction();
          onToggleCommentEntry(targetId);
        }}
        title="의견 보기 / 등록"
      >
        <MessageSquare size={12} />
        <span>의견 보기</span>
      </button>
    </div>,
    document.body
  );
}

