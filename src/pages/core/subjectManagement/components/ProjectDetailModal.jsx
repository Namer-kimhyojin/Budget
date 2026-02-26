import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { apiErrorMessage } from '../../traditionalLedger/shared';

export default function ProjectDetailModal({ project, authAxios, onClose }) {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authAxios.get('/api/entries/', { params: { entrusted_project_id: project.id } })
            .then(r => { setEntries(r.data.results || r.data); setLoading(false); })
            .catch(e => { alert(apiErrorMessage(e, '내역을 불러오지 못했습니다.')); setLoading(false); });
    }, [authAxios, project.id]);

    const num = (v) => (Number(v) || 0).toLocaleString();

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: 12, width: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                            수탁사업 예산 상세 내역 <span style={{ fontSize: '12px', background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: 12 }}>{project.year}</span>
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>[{project.code}] {project.name}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
                </div>
                <div style={{ padding: 20, overflowY: 'auto' }}>
                    {loading ? <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px' }}>불러오는 중...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ background: '#f1f5f9', color: '#475569' }}>
                                    <th style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>계정 (과목)</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>배정액수</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>집행/정산금</th>
                                    <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #cbd5e1' }}>잔여금</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>연결된 예산 내역이 없습니다.</td></tr>
                                ) : entries.map(e => (
                                    <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px 10px', color: '#1e293b', fontWeight: 500 }}>{e.subject_name_path || e.subject}</td>
                                        <td style={{ padding: '10px 10px', textAlign: 'right', color: '#0f172a' }}>{num(e.total_amount)}</td>
                                        <td style={{ padding: '10px 10px', textAlign: 'right', color: '#059669' }}>{num(e.executed_amount)}</td>
                                        <td style={{ padding: '10px 10px', textAlign: 'right', color: '#dc2626' }}>{num(e.remaining_amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
