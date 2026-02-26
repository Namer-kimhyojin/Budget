
import React from 'react';
import { STATUS_COLOR, STATUS_KO } from '../constants';

export default function StatusBadge({ status }) {
    const c = STATUS_COLOR[status] || { color: '#334155', bg: '#e2e8f0' };
    return (
        <span style={{
            fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
            color: c.color, background: c.bg, whiteSpace: 'nowrap'
        }}>
            {STATUS_KO[status] || status || '-'}
        </span>
    );
}
