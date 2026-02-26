import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { modalOverlay, modalCard, modalHeader, formLabel, formInput, modalFooter, btnCancel, btnPrimary } from '../styles';

export default function ProjCloneModal({ source, sources, orgs, busy, onConfirm, onClose }) {
    const isMulti = !!sources;
    const targets = isMulti ? sources : [source];

    const [name, setName] = useState(source?.name || '');
    const [year, setYear] = useState((targets[0]?.year || new Date().getFullYear()) + 1);
    const [orgId, setOrgId] = useState(isMulti ? '' : String(targets[0]?.organization || ''));
    const [copyEntries, setCopy] = useState(true);

    const handleConfirm = () => {
        if (!isMulti && !name.trim()) { alert('새 사업명을 입력하세요.'); return; }
        if (!year) { alert('새 연도를 확인하세요.'); return; }
        if (!isMulti && !orgId) { alert('관리부서를 지정하세요.'); return; }

        if (isMulti) {
            onConfirm({ sources: targets, year, organization: orgId ? Number(orgId) : null, copyEntries });
        } else {
            onConfirm({ sources: targets, year, name: name.trim(), organization: Number(orgId), copyEntries });
        }
    };

    return (
        <div style={modalOverlay} onClick={onClose}>
            <div style={{ ...modalCard, width: 460 }} onClick={e => e.stopPropagation()}>
                <div style={modalHeader}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>사업 다중 복사 {isMulti ? `(${targets.length}건)` : ''}</h3>
                    <X size={18} onClick={onClose} style={{ cursor: 'pointer', color: '#64748b' }} />
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                        <div style={{ color: '#64748b', marginBottom: 2 }}>{isMulti ? '복사 대상 사업' : '원본 사업'}:</div>
                        <div style={{ fontWeight: 800, color: '#1d4ed8', maxHeight: 80, overflowY: 'auto' }}>
                            {isMulti
                                ? targets.map(t => `${t.year}년 - ${t.name}`).join(', ')
                                : `${targets[0]?.year}년 - ${targets[0]?.name}`}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 12, alignItems: 'center' }}>
                        <label style={formLabel}>새 연도</label>
                        <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} style={formInput} />

                        {!isMulti && (
                            <>
                                <label style={formLabel}>새 사업명</label>
                                <input value={name} onChange={e => setName(e.target.value)} style={formInput} />
                            </>
                        )}

                        <label style={formLabel}>{isMulti ? '일괄 관리부서 변경 (선택)' : '관리부서'}</label>
                        <select value={orgId} onChange={e => setOrgId(e.target.value)}
                            style={{ ...formInput, background: '#fff' }}>
                            <option value="">{isMulti ? '변경 시 부서 선택 (미입력시 유지)' : '관리부서 선택'}</option>
                            {orgs.filter(o => !o.parent).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div onClick={() => setCopy(!copyEntries)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 18, height: 18, borderRadius: 5, border: `1px solid ${copyEntries ? '#2563eb' : '#cbd5e1'}`,
                            background: copyEntries ? '#2563eb' : '#fff', cursor: 'pointer', transition: 'all 0.15s'
                        }}>
                            {copyEntries && <Check size={12} color="#fff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>예산 수립 내역(Entry) 함께 복제</span>
                    </div>
                </div>
                <div style={modalFooter}>
                    <button onClick={onClose} style={btnCancel} disabled={busy}>취소</button>
                    <button onClick={handleConfirm} style={btnPrimary} disabled={busy}>{busy ? '복제 중...' : '복제 시작'}</button>
                </div>
            </div>
        </div>
    );
}

