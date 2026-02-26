
import React from 'react';

export function InfoBox({ type = 'info', title, message, children }) {
    const styles = {
        info: { bg: '#f3f6ff', border: '#2196f3', text: '#0066cc', icon: 'i' },
        success: { bg: '#f1f8e9', border: '#4caf50', text: '#2e7d32', icon: 'v' },
        warning: { bg: '#fff3e0', border: '#ff9800', text: '#e65100', icon: '!' },
        error: { bg: '#fee2e2', border: '#f87171', text: '#991b1b', icon: 'x' },
    };
    const style = styles[type] || styles.info;

    return (
        <div style={{ padding: '12px 16px', backgroundColor: style.bg, border: `2px solid ${style.border}`, borderRadius: '8px', color: style.text, marginBottom: '16px', fontSize: '14px' }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>{style.icon} {title}</div>
            {message && <div style={{ fontSize: '13px', opacity: 0.9, lineHeight: 1.5 }}>{message}</div>}
            {children}
        </div>
    );
}
