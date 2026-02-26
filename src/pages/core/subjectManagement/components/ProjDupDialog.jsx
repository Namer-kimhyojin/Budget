import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { modalOverlay, modalCard, modalHeader, formInput, modalFooter, btnCancel, btnPrimary } from '../styles';

const STATUS_LABEL = { PLANNED: '계획됨', ACTIVE: '활성', CLOSED: '종료' };
const num = (v) => (Number(v) || 0).toLocaleString();

export default function ProjDupDialog({ dialog, onUseExisting, onAddWithNewName, onCancel }) {
    const [newName, setNewName] = useState('');

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (dialog) setNewName((dialog.existing.name || '') + ' (2)');
    }, [dialog]);

    if (!dialog) return null;

    const { existing } = dialog;

    const handleAddWithNewName = () => {
        if (!newName.trim()) return;
        onAddWithNewName(newName.trim());
    };

    return (
        <div style={modalOverlay} onClick={onCancel}>
            <div style={{ ...modalCard, width: 480 }} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 10,
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, boxShadow: '0 3px 8px rgba(245,158,11,.3)',
                        }}>
                            <AlertTriangle size={17} color="#fff" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>중복 사업명 감지</h3>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: 2 }}>같은 부서·연도에 동일한 이름의 수탁사업이 있습니다.</div>
                        </div>
                    </div>
                    <X size={18} onClick={onCancel} style={{ cursor: 'pointer', color: '#64748b' }} />
                </div>

                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                    {/* 기존 사업 정보 */}
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>기존 사업</div>
                        <div style={{ background: '#fefce8', border: '1.5px solid #fde68a', borderRadius: 10, padding: '12px 16px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>{existing.name}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: '11.5px', color: '#64748b' }}>
                                <span>연도: <strong style={{ color: '#334155' }}>{existing.year}년</strong></span>
                                <span>상태: <strong style={{ color: '#334155' }}>{STATUS_LABEL[existing.status] ?? existing.status}</strong></span>
                                {existing.total_budget != null && (
                                    <span>예산액: <strong style={{ color: '#334155' }}>{num(existing.total_budget)}원</strong></span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onUseExisting}
                            style={{
                                marginTop: 10, width: '100%', padding: '9px 14px',
                                borderRadius: 8, border: '1.5px solid #d97706',
                                background: '#fffbeb', color: '#92400e',
                                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}
                        >
                            기존 사업 그대로 사용 (추가 취소)
                        </button>
                    </div>

                    {/* 구분선 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>
                            <ArrowRight size={12} />또는 새 이름으로 추가
                        </div>
                        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                    </div>

                    {/* 이름 변경 입력 */}
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>새 사업명</div>
                        <input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddWithNewName(); }}
                            style={{ ...formInput, width: '100%', boxSizing: 'border-box' }}
                            placeholder="변경할 사업명 입력"
                            autoFocus
                        />
                    </div>
                </div>

                <div style={modalFooter}>
                    <button onClick={onCancel} style={btnCancel}>취소</button>
                    <button onClick={handleAddWithNewName} style={{ ...btnPrimary, opacity: newName.trim() ? 1 : 0.5 }} disabled={!newName.trim()}>
                        이름 변경 후 추가
                    </button>
                </div>
            </div>
        </div>
    );
}
