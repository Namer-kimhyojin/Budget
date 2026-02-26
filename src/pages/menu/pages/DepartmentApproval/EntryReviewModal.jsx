import React from 'react';
import { X } from 'lucide-react';
import { num } from '../../shared/utils';
import TraditionalLedgerView from '../../../core/TraditionalLedgerView';
import { DEPT_APPROVAL_STRINGS as S } from './constants';

export default function EntryReviewModal({
  isOpen,
  selectedSubmissionGroup,
  detailModalPrimaryEntry,
  detailModalTotalAmount,
  detailEntryIds,
  onClose,
  authAxios,
  entries,
  subjects,
  orgs,
  projects,
  onRefreshEntries,
  modal,
  version,
  versions,
  setVersion,
  user,
  selectedDeptId,
  selectedTeamId,
}) {
  if (!isOpen || !selectedSubmissionGroup) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 20000,
        background: 'rgba(15,23,42,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(1320px, calc(100vw - 24px))',
          maxHeight: 'calc(100vh - 24px)',
          background: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 20px 40px -12px rgba(15,23,42,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <strong style={{ fontSize: '14px', color: '#0f172a' }}>{S.entryReviewTitle}</strong>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              제출자 {selectedSubmissionGroup.submitterName || selectedSubmissionGroup.submitterId} | 예산 항목 {selectedSubmissionGroup.entryCount}건
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
            title="닫기"
          >
            <X size={14} />
          </button>
        </div>

        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid #eef2f7',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 8,
            background: '#f8fafc',
          }}
        >
          {[
            { label: '제출자 ID', value: selectedSubmissionGroup.submitterId || '-' },
            { label: '제출자명', value: selectedSubmissionGroup.submitterName || '-' },
            { label: '제출일시', value: selectedSubmissionGroup.submittedAtLabel || '-' },
            {
              label: '검토 대상',
              value: detailModalPrimaryEntry
                ? `${detailModalPrimaryEntry.subject_name || detailModalPrimaryEntry.subject_code || `#${detailModalPrimaryEntry.subject}`}${selectedSubmissionGroup.entryCount > 1 ? ` 외 ${selectedSubmissionGroup.entryCount - 1}건` : ''}`
                : '-',
            },
            {
              label: '산출내역',
              value: `${selectedSubmissionGroup.detailCount}건 / ${num(detailModalTotalAmount)}원`,
            },
          ].map((item) => (
            <div key={item.label} style={{ border: '1px solid #e2e8f0', borderRadius: 8, background: '#ffffff', padding: '8px 10px' }}>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ overflow: 'auto', flex: 1 }}>
          <TraditionalLedgerView
            authAxios={authAxios}
            entries={entries}
            subjects={subjects}
            orgs={orgs}
            projects={projects}
            onRefresh={onRefreshEntries}
            modalApi={modal}
            version={version}
            versions={versions}
            setVersion={setVersion}
            user={user}
            targetDeptId={selectedDeptId ? Number(selectedDeptId) : null}
            targetTeamId={selectedTeamId ? Number(selectedTeamId) : null}
            focusEntryIds={detailEntryIds}
            embeddedMode={true}
          />
        </div>
      </div>
    </div>
  );
}
