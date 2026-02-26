
import React from 'react';

export function Modal({ isOpen, onClose, title, children, footer, width = 500 }) {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
            <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: width, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>&times;</button>
                </div>
                <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                    {children}
                </div>

                {footer && (
                    <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, backgroundColor: '#f8fafc', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
