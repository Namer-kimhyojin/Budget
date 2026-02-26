
import React from 'react';

export function GuideBox({ title, steps = [] }) {
    return (
        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '8px', marginBottom: '16px' }}>
            {title ? <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', color: '#1e293b' }}>{title}</div> : null}
            <ol style={{ margin: 0, paddingLeft: '20px', color: '#475569', fontSize: '13px', lineHeight: 1.8 }}>
                {steps.map((step, idx) => <li key={idx} style={{ marginBottom: '6px' }}>{step}</li>)}
            </ol>
        </div>
    );
}
