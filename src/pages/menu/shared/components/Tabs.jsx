
import React from 'react';

export function Tabs({ tabs = [], activeTab, onTabChange }) {
    return (
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: 20, gap: 24 }}>
            {tabs.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        style={{
                            padding: '12px 4px',
                            border: 'none',
                            background: 'none',
                            fontSize: '15px',
                            fontWeight: isActive ? 800 : 500,
                            color: isActive ? '#3b82f6' : '#64748b',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.label}
                        {isActive && <div style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 2, backgroundColor: '#3b82f6', borderRadius: 2 }} />}
                    </button>
                );
            })}
        </div>
    );
}
