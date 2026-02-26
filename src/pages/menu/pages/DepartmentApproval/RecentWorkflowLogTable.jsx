import React from 'react';
import { menuStyles, EmptyState } from '../../shared/menuUi';
import { STATUS_LABELS } from './helpers';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleTable, simpleTh, simpleTd } = menuStyles;

const formatLogDateTime = (value) => {
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString('ko-KR', { hour12: false });
};

export default function RecentWorkflowLogTable({ logs }) {
  return (
    <section style={menuPanelCard}>
      <div style={{ ...menuPanelHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>최근 워크플로우 로그</span>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>
          최근 {Math.min(12, logs.length)}건
        </span>
      </div>

      <div style={{ ...menuPanelBody, paddingTop: 10, overflowX: 'auto' }}>
        {!logs.length ? (
          <EmptyState icon="?" title="로그 없음" message="현재 범위에 표시할 최근 로그가 없습니다." />
        ) : (
          <table style={simpleTable}>
            <thead>
              <tr>
                <th style={{ ...simpleTh, minWidth: 140 }}>시각</th>
                <th style={{ ...simpleTh, minWidth: 80 }}>항목</th>
                <th style={{ ...simpleTh, minWidth: 110 }}>처리자</th>
                <th style={{ ...simpleTh, minWidth: 150 }}>상태 변경</th>
                <th style={simpleTh}>사유</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                const from = STATUS_LABELS[log.from_status] || log.from_status || '-';
                const to = STATUS_LABELS[log.to_status] || log.to_status || '-';
                return (
                  <tr key={log.id || `${log.entry}-${idx}`}>
                    <td style={simpleTd}>{formatLogDateTime(log.created_at)}</td>
                    <td style={{ ...simpleTd, fontWeight: 700 }}>#{log.entry}</td>
                    <td style={simpleTd}>{log.actor_name || log.actor || '-'}</td>
                    <td style={simpleTd}>{from} {'->'} {to}</td>
                    <td style={{ ...simpleTd, color: log.reason ? '#334155' : '#94a3b8' }}>
                      {String(log.reason || '').trim() || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
