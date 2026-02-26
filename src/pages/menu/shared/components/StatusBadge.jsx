
import React from 'react';
import { ENTRY_STATUS_LABELS, VERSION_STATUS_LABELS } from '../../config';

export function StatusBadge({ status, type = 'entry' }) {
    const labels = type === 'version' ? VERSION_STATUS_LABELS : ENTRY_STATUS_LABELS;
    const label = labels[status] || status;

    let color = '#334155';
    let bg = '#e2e8f0';

    if (status === 'FINALIZED' || status === 'CONFIRMED' || status === 'COMPLETED') {
        color = '#065f46'; bg = '#d1fae5';
    } else if (status === 'REVIEWING' || status === 'PENDING' || status === 'SUBMITTED' || status === 'ACTIVE') {
        color = '#1d4ed8'; bg = '#dbeafe';
    } else if (status === 'DRAFT' || status === 'WRITING') {
        color = '#9a3412'; bg = '#ffedd5';
    } else if (status === 'CLOSED' || status === 'EXPIRED') {
        color = '#991b1b'; bg = '#fee2e2';
    }

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            color, background: bg, border: `1px solid ${color}22`,
            whiteSpace: 'nowrap'
        }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
        </span>
    );
}
