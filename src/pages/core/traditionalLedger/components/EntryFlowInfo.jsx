import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';

export default function EntryFlowInfo({ entry, onToggleComment, unresolvedTypes }) {
  const unresolved = Array.isArray(unresolvedTypes)
    ? unresolvedTypes
    : (Array.isArray(entry?.unresolved_types) ? entry.unresolved_types : []);

  const hasUnresolvedRequest = unresolved.includes('REQUEST');
  const hasUnresolvedQuestion = unresolved.includes('QUESTION');
  if (!hasUnresolvedRequest && !hasUnresolvedQuestion) return null;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 0, flexWrap: 'nowrap', lineHeight: 1 }}>
      {hasUnresolvedRequest && (
        <button
          type="button"
          onClick={() => onToggleComment(entry.id)}
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            border: '1px solid #fca5a5',
            background: '#fee2e2',
            color: '#b91c1c',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title="미해소 수정요청이 있습니다"
        >
          <AlertCircle size={8} />
        </button>
      )}

      {hasUnresolvedQuestion && (
        <button
          type="button"
          onClick={() => onToggleComment(entry.id)}
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            border: '1px solid #fde047',
            background: '#fef9c3',
            color: '#854d0e',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          title="미답변 질문이 있습니다"
        >
          <HelpCircle size={8} />
        </button>
      )}
    </div>
  );
}
