import React, { useMemo, useState } from 'react';
import { menuStyles, EmptyState } from '../../../shared/menuUi';
import { formatDatetime } from '../../../shared/utils';
import StatusBadge from './StatusBadge';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleTable, simpleTh, simpleTd, menuGhostBtn } = menuStyles;

export default function LogTable({ logs, loading, highlighted }) {
  const [sortCol, setSortCol] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const highlightSet = useMemo(() => (highlighted ? new Set(highlighted) : null), [highlighted]);

  const sorted = useMemo(() => {
    return [...logs].sort((a, b) => {
      let av = a[sortCol];
      let bv = b[sortCol];
      if (sortCol === 'created_at') {
        av = new Date(av);
        bv = new Date(bv);
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [sorted, currentPage]);

  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortIcon = (col) => (sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕');

  return (
    <section style={menuPanelCard}>
      <div style={{ ...menuPanelHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>감사 로그 ({sorted.length}건)</span>
        {highlighted && (
          <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>
            이상징후 항목 강조 표시 중
          </span>
        )}
      </div>

      <div style={{ ...menuPanelBody, padding: 0, overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>불러오는 중...</div>
        ) : sorted.length === 0 ? (
          <EmptyState icon="📭" title="로그 없음" message="검색 조건에 해당하는 감사 로그가 없습니다." />
        ) : (
          <>
            <table style={simpleTable}>
              <thead>
                <tr>
                  <th style={{ ...simpleTh, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('created_at')}>
                    일시{sortIcon('created_at')}
                  </th>
                  <th style={{ ...simpleTh, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('log_type')}>
                    구분{sortIcon('log_type')}
                  </th>
                  <th style={{ ...simpleTh, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('action')}>
                    액션{sortIcon('action')}
                  </th>
                  <th style={simpleTh}>대상</th>
                  <th style={simpleTh}>이전 상태</th>
                  <th style={simpleTh}>변경 상태</th>
                  <th style={{ ...simpleTh, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('actor_name')}>
                    처리자{sortIcon('actor_name')}
                  </th>
                  <th style={{ ...simpleTh, cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('status_code')}>
                    결과{sortIcon('status_code')}
                  </th>
                  <th style={simpleTh}>사유</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((log, idx) => {
                  const isAnomalous = highlightSet && highlightSet.has(log.id);
                  const target = log.entry
                    ? `Entry #${log.entry}`
                    : `${log.resource_type || '-'}${log.resource_id ? ` #${log.resource_id}` : ''}`;

                  return (
                    <tr
                      key={log.id ?? idx}
                      style={{
                        background: isAnomalous ? '#fffbeb' : undefined,
                        outline: isAnomalous ? '2px solid #fcd34d' : undefined,
                        outlineOffset: isAnomalous ? '-1px' : undefined,
                      }}
                    >
                      <td style={{ ...simpleTd, whiteSpace: 'nowrap', fontSize: 13 }}>
                        {formatDatetime(log.created_at)}
                        {isAnomalous && <span style={{ marginLeft: 4, fontSize: 11, color: '#d97706' }}>!</span>}
                      </td>
                      <td style={{ ...simpleTd, fontWeight: 700 }}>{log.log_type || '-'}</td>
                      <td style={{ ...simpleTd }}><StatusBadge status={log.action} /></td>
                      <td style={{ ...simpleTd, fontWeight: 600 }}>{target}</td>
                      <td style={{ ...simpleTd, textAlign: 'center' }}><StatusBadge status={log.from_status} /></td>
                      <td style={{ ...simpleTd, textAlign: 'center' }}><StatusBadge status={log.to_status} /></td>
                      <td style={{ ...simpleTd, fontWeight: 600 }}>{log.actor_display || log.actor_name || '-'}</td>
                      <td style={{ ...simpleTd, textAlign: 'center' }}>{log.status_code || '-'}</td>
                      <td
                        title={log.reason || ''}
                        style={{
                          ...simpleTd,
                          color: log.reason ? '#1e293b' : '#94a3b8',
                          fontStyle: log.reason ? 'normal' : 'italic',
                          maxWidth: 320,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.reason || '없음'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
                <button style={{ ...menuGhostBtn, padding: '4px 10px', fontSize: 13 }} disabled={currentPage === 1} onClick={() => setPage(1)}>처음</button>
                <button style={{ ...menuGhostBtn, padding: '4px 10px', fontSize: 13 }} disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>이전</button>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{currentPage} / {totalPages}</span>
                <button style={{ ...menuGhostBtn, padding: '4px 10px', fontSize: 13 }} disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>다음</button>
                <button style={{ ...menuGhostBtn, padding: '4px 10px', fontSize: 13 }} disabled={currentPage === totalPages} onClick={() => setPage(totalPages)}>마지막</button>
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>
                  총 {sorted.length}건 중 {(currentPage - 1) * PAGE_SIZE + 1} ~ {Math.min(currentPage * PAGE_SIZE, sorted.length)}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
