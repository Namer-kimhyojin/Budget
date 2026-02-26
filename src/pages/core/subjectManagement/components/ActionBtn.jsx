import React, { useState } from 'react';

export function ActionBtn({ icon, label, color, bg, border, onClick, disabled }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            title={label}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                background: hov ? color : bg,
                color: hov ? '#fff' : color,
                border: `1px solid ${border}`,
                borderRadius: 5, padding: '3px 7px', fontSize: '10px', fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all 0.12s', whiteSpace: 'nowrap',
            }}
        >
            {icon}{label}
        </button>
    );
}
