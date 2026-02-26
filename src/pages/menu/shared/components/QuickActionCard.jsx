
import React from 'react';

export function QuickActionCard({ title = '⚡ 빠른 액션', items = [], onItemClick }) {
    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>{title}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {items.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => onItemClick?.(item.action)}
                        style={{
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: '#f8fafc',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#334155',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#e0e7ff';
                            e.target.style.borderColor = '#3b82f6';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#f8fafc';
                            e.target.style.borderColor = '#e2e8f0';
                        }}
                    >
                        <span>{item.label}</span>
                        <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '999px', padding: '2px 8px', fontSize: '12px', fontWeight: 700 }}>
                            {item.count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
