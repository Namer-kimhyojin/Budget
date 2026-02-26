import React, { useState } from 'react';
import { X } from 'lucide-react';
import { modalOverlay, modalCard, modalHeader, formLabel, formInput, modalFooter, btnCancel, btnPrimary } from '../styles';

export default function OrgAddModal({ parent, onConfirm, onClose }) {
    const [name, setName] = useState('');
    const isTeam = !!parent;
    const typeLabel = isTeam ? '팀' : '부서';
    const lvlColor = isTeam ? '#0891b2' : '#1d4ed8';

    const handleConfirm = () => {
        if (!name.trim()) { alert('명칭을 입력하세요.'); return; }
        onConfirm({ name: name.trim(), org_type: isTeam ? 'team' : 'dept' });
    };

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={modalCard} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                        {parent ? `${parent.name} > ` : ''}<span style={{ color: lvlColor }}>{typeLabel}</span> 추가
                    </h3>
                    <X size={18} onClick={onClose} style={{ cursor: 'pointer', color: '#64748b' }} />
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                        <label style={formLabel}>{typeLabel} 명칭</label>
                        <input autoFocus value={name} onChange={e => setName(e.target.value)}
                            placeholder={`${typeLabel} 명칭 입력`} style={formInput}
                            onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onClose(); }} />
                    </div>
                    {parent && (
                        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px', fontSize: '11px', color: '#64748b' }}>
                            상위: <b style={{ color: '#1d4ed8' }}>{parent.name}</b>
                        </div>
                    )}
                </div>
                <div style={modalFooter}>
                    <button onClick={onClose} style={btnCancel}>취소</button>
                    <button onClick={handleConfirm} style={btnPrimary}>추가</button>
                </div>
            </div>
        </div>
    );
}
