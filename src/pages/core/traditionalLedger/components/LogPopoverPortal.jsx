import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import {
  logGroupMore,
  logGroupSection,
  logGroupSectionTitle,
  logItemEmpty,
  logItemFlow,
  logItemMeta,
  logItemReason,
  logItemRow,
  logPopoverCard,
  logPopoverCloseBtn,
  logPopoverCount,
  logPopoverFoot,
  logPopoverHead,
  logPopoverHeadText,
  logPopoverList,
  logPopoverMoreBtn,
  logPopoverSubtitle,
  logPopoverTitle,
} from '../styles';

export default function LogPopoverPortal({
  openLogEntry,
  logAnchor,
  logPopoverRef,
  logPopoverZIndex,
  statusLabel,
  formatLogDateTime,
  openLogGroupItems,
  openLogEntryRecent,
  openLogEntryLogs,
  closeLogPopover,
  openEntryHistoryLog,
}) {
  if (!(openLogEntry && logAnchor)) return null;

  return createPortal(
    <div
      ref={logPopoverRef}
      style={{ ...logPopoverCard, zIndex: logPopoverZIndex, top: logAnchor.top, left: logAnchor.left }}
    >
      <div style={logPopoverHead}>
        <div style={logPopoverHeadText}>
          <strong style={logPopoverTitle}>
            {openLogEntry.mode === 'reject' ? '최근 검토 의견 로그' : '최근 변경 로그'}
          </strong>
          <span style={logPopoverSubtitle} title={openLogEntry.title}>{openLogEntry.title}</span>
        </div>
        <button type="button" style={logPopoverCloseBtn} onClick={closeLogPopover} title="닫기">
          <X size={12} />
        </button>
      </div>
      <div style={logPopoverList}>
        {openLogEntry.groupKey && openLogGroupItems ? (
          openLogGroupItems.length ? openLogGroupItems.map((item) => (
            <div key={item.entryId} style={logGroupSection}>
              <div style={logGroupSectionTitle}>{item.subjectName}</div>
              {item.logs.slice(0, 2).map((log, idx) => {
                const actor = log.actor_name || log.actor || '시스템';
                const from = statusLabel[log.from_status] || log.from_status || '-';
                const to = statusLabel[log.to_status] || log.to_status || '-';
                const reason = String(log.reason || '').trim();
                return (
                  <div key={log.id || `${log.created_at}-${idx}`} style={logItemRow}>
                    <div style={logItemMeta}>
                      <span>{formatLogDateTime(log.created_at)}</span>
                    </div>
                    <div style={logItemFlow}>{actor} | {from} {'->'} {to}</div>
                    {reason ? <div style={logItemReason}>{reason}</div> : null}
                  </div>
                );
              })}
              {item.logs.length > 2 && (
                <div style={logGroupMore}>+{item.logs.length - 2}건 더</div>
              )}
            </div>
          )) : (
            <div style={logItemEmpty}>표시할 로그가 없습니다.</div>
          )
        ) : (
          openLogEntryRecent.length ? openLogEntryRecent.map((log, idx) => {
            const actor = log.actor_name || log.actor || '시스템';
            const from = statusLabel[log.from_status] || log.from_status || '-';
            const to = statusLabel[log.to_status] || log.to_status || '-';
            const reason = String(log.reason || '').trim();
            return (
              <div key={log.id || `${log.created_at}-${idx}`} style={logItemRow}>
                <div style={logItemMeta}>
                  <span>{idx + 1}</span>
                  <span>{formatLogDateTime(log.created_at)}</span>
                </div>
                <div style={logItemFlow}>{actor} | {from} {'->'} {to}</div>
                {reason ? <div style={logItemReason}>{reason}</div> : null}
              </div>
            );
          }) : (
            <div style={logItemEmpty}>표시할 로그가 없습니다.</div>
          )
        )}
      </div>
      <div style={logPopoverFoot}>
        <span style={logPopoverCount}>
          {openLogEntryLogs.length > 5 ? `+${openLogEntryLogs.length - 5}건 더 있음` : `${openLogEntryLogs.length}건`}
        </span>
        {!openLogEntry.groupKey && (
          <button
            type="button"
            style={logPopoverMoreBtn}
            onClick={async () => {
              const modalEntry = { id: openLogEntry.id, subject_name: openLogEntry.title };
              const logMode = openLogEntry.mode || 'change';
              closeLogPopover();
              await openEntryHistoryLog(modalEntry, logMode);
            }}
          >
            전체보기
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

