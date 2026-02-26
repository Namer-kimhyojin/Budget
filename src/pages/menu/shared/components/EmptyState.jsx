
import React from 'react';

export function EmptyState({ icon = '[]', title, message, actionLabel, onAction }) {
    return (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: '#94a3b8' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>{icon}</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#64748b', marginBottom: '8px' }}>{title}</div>
            <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.5 }}>{message}</div>
            {actionLabel && onAction && (
                <button
                    style={{ padding: '8px 16px', backgroundColor: '#1976d2', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}
                    onClick={onAction}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
