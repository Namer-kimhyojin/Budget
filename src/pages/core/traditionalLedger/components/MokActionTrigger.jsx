import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { mokActionPopoverWrap, mokActionTrigger } from '../styles';

export default function MokActionTrigger({
  entryId,
  isOpen,
  setActionRef,
  closeAction,
  openAction,
  dragProps,
  dragStyle,
}) {
  return (
    <div
      style={mokActionPopoverWrap}
      ref={(node) => {
        setActionRef(entryId, node);
      }}
    >
      <button
        type="button"
        style={{ ...mokActionTrigger, ...(dragStyle || {}) }}
        title="이동 지점의 아래로 항목의 이동합니다."
        aria-expanded={isOpen}
        {...(dragProps || {})}
        onClick={(event) => {
          if (isOpen) {
            closeAction();
            return;
          }
          openAction(entryId, event.currentTarget);
        }}
      >
        <MoreHorizontal size={11} />
      </button>
    </div>
  );
}
