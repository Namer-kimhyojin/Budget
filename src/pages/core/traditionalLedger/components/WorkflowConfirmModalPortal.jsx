import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { numInThousand } from '../shared';

export default function WorkflowConfirmModalPortal({
  wfModal,
  workflowModalZIndex,
  setWfModal,
  statusLabel,
  deptStatus,
  version,
  executeWorkflow,
}) {
  if (!wfModal) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: workflowModalZIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={() => setWfModal(null)}>
      <div style={{ background: '#fff', borderRadius: 14, width: 'min(560px, 96vw)', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,.3)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafbfc' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>{wfModal.actionLabel}</h3>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#f1f5f9', color: '#475569' }}>
                {statusLabel[deptStatus]} → {statusLabel[wfModal.targetStatus]}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{wfModal.orgName} · {version?.year}년 {version?.name}</span>
          </div>
          <button type="button" onClick={() => setWfModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex', alignItems: 'center', borderRadius: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '10px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>{wfModal.description}</p>
        </div>

        {wfModal.warnings.length > 0 && (
          <div style={{ padding: '8px 20px', background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
            {wfModal.warnings.map((w, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '11px', color: w.type === 'error' ? '#b91c1c' : '#92400e', padding: '3px 0', lineHeight: 1.5 }}>
                <span style={{ fontSize: '13px', flexShrink: 0, marginTop: 1 }}>{w.type === 'error' ? '🚫' : '⚠️'}</span>
                <span style={{ whiteSpace: 'pre-wrap' }}>{w.msg}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '12px 20px', maxHeight: 200, overflowY: 'auto', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
            처리 대상 항목 ({wfModal.entrySummaries.length}건)
            {wfModal.ineligible.length > 0 && (
              <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: 8 }}>
                제외 {wfModal.ineligible.length}건 (상태 불일치)
              </span>
            )}
          </div>
          {wfModal.entrySummaries.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>처리 가능한 항목이 없습니다.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '4px 6px', color: '#94a3b8', fontWeight: 600 }}>항</th>
                  <th style={{ textAlign: 'left', padding: '4px 6px', color: '#94a3b8', fontWeight: 600 }}>목</th>
                  <th style={{ textAlign: 'right', padding: '4px 6px', color: '#94a3b8', fontWeight: 600 }}>예산액</th>
                  <th style={{ textAlign: 'center', padding: '4px 6px', color: '#94a3b8', fontWeight: 600 }}>내역</th>
                </tr>
              </thead>
              <tbody>
                {wfModal.entrySummaries.map(es => (
                  <tr key={es.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '4px 6px', color: '#64748b' }}>{es.hangName}</td>
                    <td style={{ padding: '4px 6px', color: '#1e293b', fontWeight: 500 }}>{es.mokName}</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: es.amount === 0 ? '#ef4444' : '#1e293b' }}>
                      {numInThousand(es.amount)}
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center', color: '#94a3b8' }}>
                      {es.detailCount === 0 ? <span style={{ color: '#ef4444' }}>없음</span> : `${es.detailCount}건`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {wfModal.action === 'reject' && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>반려 사유 <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              value={wfModal.reason}
              onChange={e => setWfModal(p => ({ ...p, reason: e.target.value }))}
              placeholder="반려 사유를 입력하세요..."
              style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: '12px', resize: 'vertical', minHeight: 60, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        )}

        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => setWfModal(null)}
            style={{ padding: '8px 18px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>
            취소
          </button>
          <button onClick={executeWorkflow} disabled={!wfModal.eligible.length || (wfModal.action === 'submit' && wfModal.submitBlocked)}
            style={{
              padding: '8px 22px', border: 'none', borderRadius: 8, fontSize: '12px', fontWeight: 700, cursor: (!wfModal.eligible.length || (wfModal.action === 'submit' && wfModal.submitBlocked)) ? 'not-allowed' : 'pointer',
              background: wfModal.action === 'reject' ? '#ef4444' : wfModal.action === 'reopen' ? '#f59e0b' : '#2563eb',
              color: '#fff', opacity: (wfModal.eligible.length && !(wfModal.action === 'submit' && wfModal.submitBlocked)) ? 1 : 0.45,
            }}>
            {wfModal.actionLabel} 실행
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
