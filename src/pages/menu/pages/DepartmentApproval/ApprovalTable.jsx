import React from 'react';
import { AlertCircle, Eye, History, Sparkles } from 'lucide-react';
import { menuStyles, StatusBadge, EmptyState } from '../../shared/menuUi';
import { num } from '../../shared/utils';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleTable, simpleTh, simpleTd } = menuStyles;

const iconBtnBase = {
  width: 18,
  height: 18,
  borderRadius: 999,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#64748b',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  position: 'relative',
};

const iconBtnNew = {
  ...iconBtnBase,
  color: '#1d4ed8',
  borderColor: '#93c5fd',
  background: '#eff6ff',
  boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.18)',
};

const iconBtnReject = {
  ...iconBtnBase,
  color: '#b91c1c',
  borderColor: '#fecaca',
  background: '#fef2f2',
};

const viewBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  border: '1px solid #bfdbfe',
  borderRadius: 7,
  background: '#eff6ff',
  color: '#1d4ed8',
  cursor: 'pointer',
  padding: '4px 8px',
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

const sparkleDot = {
  position: 'absolute',
  top: -4,
  right: -4,
  width: 12,
  height: 12,
  borderRadius: 999,
  background: '#2563eb',
  color: '#ffffff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid #ffffff',
};

export default function ApprovalTable({
  groups,
  selectedGroupKey,
  onSelectGroup,
  onOpenLog,
  onOpenDetail,
}) {
  return (
    <section style={menuPanelCard}>
      <div style={{ ...menuPanelHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>제출 예산 목록</span>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>총 {groups.length}건</span>
      </div>

      <div style={{ ...menuPanelBody, paddingTop: 10, overflowX: 'auto' }}>
        {!groups.length ? (
          <EmptyState icon="📭" title="제출 내역 없음" message="현재 조건에 해당하는 제출 내역이 없습니다." />
        ) : (
          <table style={simpleTable}>
            <thead>
              <tr>
                <th style={{ ...simpleTh, minWidth: 100 }}>제출자 ID</th>
                <th style={{ ...simpleTh, minWidth: 230 }}>제출 예산 항목</th>
                <th style={{ ...simpleTh, minWidth: 120 }}>조직</th>
                <th style={{ ...simpleTh, minWidth: 170 }}>제출 정보</th>
                <th style={{ ...simpleTh, minWidth: 160 }}>상태 / 로그</th>
                <th style={{ ...simpleTh, minWidth: 110, textAlign: 'right' }}>금액</th>
                <th style={{ ...simpleTh, minWidth: 88, textAlign: 'center' }}>검토</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const isSelected = String(selectedGroupKey || '') === String(group.key);

                return (
                  <tr
                    key={group.key}
                    onClick={() => {
                      onSelectGroup(group.key);
                      onOpenDetail(group);
                    }}
                    style={{ background: isSelected ? '#eff6ff' : '#ffffff', cursor: 'pointer' }}
                  >
                    <td style={simpleTd}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{group.submitterId}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{group.submitterName || '-'}</span>
                      </div>
                    </td>
                    <td style={simpleTd}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{group.subjectSummaryLabel}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>예산 항목 {group.entryCount}건</span>
                      </div>
                    </td>
                    <td style={simpleTd}>{group.organizationSummary}</td>
                    <td style={simpleTd}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 11, color: '#334155', fontWeight: 700 }}>{group.submitterId}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{group.submittedAtLabel || '-'}</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{`산출내역 ${group.detailCount}건`}</span>
                      </div>
                    </td>
                    <td style={simpleTd}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <StatusBadge status={group.status} />
                        {group.changeLogCount > 0 && (
                          <button
                            type="button"
                            style={group.hasNewLog ? iconBtnNew : iconBtnBase}
                            title={group.hasNewLog ? '새 변경 로그' : '변경 로그'}
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenLog(group, 'change');
                            }}
                          >
                            <History size={11} />
                            {group.hasNewLog && (
                              <span style={sparkleDot}>
                                <Sparkles size={8} />
                              </span>
                            )}
                          </button>
                        )}
                        {group.rejectLogCount > 0 && (
                          <button
                            type="button"
                            style={iconBtnReject}
                            title="반려 의견 로그"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenLog(group, 'reject');
                            }}
                          >
                            <AlertCircle size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ ...simpleTd, textAlign: 'right', fontWeight: 700 }}>{num(group.totalAmount || 0)}</td>
                    <td style={{ ...simpleTd, textAlign: 'center' }}>
                      <button
                        type="button"
                        style={viewBtn}
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenDetail(group);
                        }}
                      >
                        <Eye size={12} /> 상세
                      </button>
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
