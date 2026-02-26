
import React from 'react';
import { menuStyles } from '../../../shared/menuUi';
import { LEVEL_STYLE } from '../constants';

const { menuPanelCard, menuPanelHead, menuPanelBody, menuGhostBtn } = menuStyles;

function AnomalyCard({ anomaly, onHighlight }) {
    const s = LEVEL_STYLE[anomaly.level] || LEVEL_STYLE.info;
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            background: s.bg, border: `1px solid ${s.border}`
        }}>
            <span style={{
                width: 22, height: 22, borderRadius: '50%', background: s.badge,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, flexShrink: 0
            }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{anomaly.title}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{anomaly.desc}</div>
            </div>
            {anomaly.logs.length > 0 && (
                <button
                    onClick={() => onHighlight(anomaly.logs)}
                    style={{ ...menuGhostBtn, fontSize: 12, padding: '4px 8px', flexShrink: 0 }}
                >
                    강조
                </button>
            )}
        </div>
    );
}

export default function AnomalyPanel({ anomalies, highlighted, setHighlighted }) {
    if (!anomalies.length) return null;

    return (
        <section style={menuPanelCard}>
            <div style={{ ...menuPanelHead, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>이상징후 분석 ({anomalies.length}건)</span>
                {highlighted && (
                    <button style={{ ...menuGhostBtn, fontSize: 12, padding: '2px 8px' }} onClick={() => setHighlighted(null)}>
                        강조 해제
                    </button>
                )}
            </div>
            <div style={{ ...menuPanelBody, gap: 6 }}>
                {anomalies.map((a, i) => (
                    <AnomalyCard key={i} anomaly={a} onHighlight={ids => setHighlighted(ids)} />
                ))}
            </div>
        </section>
    );
}
