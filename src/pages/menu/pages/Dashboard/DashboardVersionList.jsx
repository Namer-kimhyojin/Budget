
import React, { useMemo, useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { menuStyles, StatusBadge } from '../../shared/menuUi';
import { apiErrorMessage } from '../../shared/utils';

const {
    menuPanelCard, menuPanelHead, menuPanelBody,
    simpleTable, simpleTh, simpleTd, simpleSelect, menuGhostBtn
} = menuStyles;

export default function DashboardVersionList({ versions, canManage, setVersion, onNavigate, authAxios, onBootstrap, modalApi, lastUpdated }) {
    const [statusById, setStatusById] = useState({});
    const [savingId, setSavingId] = useState(null);

    useEffect(() => {
        const next = {};
        versions.forEach(v => { next[v.id] = v.status; });
        setStatusById(next);
    }, [versions]);

    const sortedVersions = useMemo(() => [...versions].sort((a, b) => b.year - a.year || b.round - a.round), [versions]);

    const saveVersionStatus = async (item) => {
        const nextStatus = statusById[item.id];
        if (!nextStatus || nextStatus === item.status) return;
        setSavingId(item.id);
        try {
            await authAxios.patch(`/api/versions/${item.id}/`, {
                status: nextStatus,
                confirmed_at: nextStatus === 'CONFIRMED' ? new Date().toISOString() : null,
            });
            await onBootstrap();
            await modalApi.alert('예산 상태 정보가 저장되었습니다.');
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, '변경에 실패했습니다.'));
        } finally { setSavingId(null); }
    };

    return (
        <section style={menuPanelCard}>
            <div style={{ ...menuPanelHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={18} color="#f97316" />
                    <span style={{ fontWeight: 800, fontSize: 16 }}>예산 목록</span>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>마지막 집계: {lastUpdated.toLocaleTimeString('ko-KR')}</div>
            </div>
            <div style={{ ...menuPanelBody, padding: 0 }}>
                <table style={{ ...simpleTable, border: 'none' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th style={{ ...simpleTh, padding: '12px 24px', width: 80 }}>년도</th>
                            <th style={simpleTh}>예산명</th>
                            <th style={simpleTh}>기간</th>
                            <th style={simpleTh}>상태</th>
                            <th style={simpleTh}>상태변경</th>
                            <th style={{ ...simpleTh, textAlign: 'center', paddingRight: 24 }}>작업</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedVersions.map(item => {
                            return (
                                <tr key={item.id} style={{
                                    backgroundColor: 'transparent',
                                    borderBottom: '1px solid #f1f5f9',
                                    transition: 'background 0.2s'
                                }}>
                                    <td style={{ ...simpleTd, paddingLeft: 24, fontWeight: 600 }}>{item.year}</td>
                                    <td style={{ ...simpleTd, fontWeight: 700, color: '#334155' }}>{item.name}</td>
                                    <td style={{ ...simpleTd, fontSize: 13, color: '#64748b' }}>
                                        {item.start_date ? `${item.start_date.substring(5)} ~ ${item.end_date.substring(5)}` : '-'}
                                    </td>
                                    <td style={simpleTd}>
                                        <StatusBadge status={item.status} type="version" />
                                    </td>
                                    <td style={simpleTd}>
                                        {canManage && (
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <select
                                                    style={{ ...simpleSelect, padding: '4px 8px', fontSize: 12, minWidth: 120, border: '1px solid #cbd5e1' }}
                                                    value={statusById[item.id] || item.status}
                                                    onChange={e => setStatusById({ ...statusById, [item.id]: e.target.value })}
                                                >
                                                    <option value="DRAFT">준비중</option>
                                                    <option value="PENDING">제출대기</option>
                                                    <option value="CONFIRMED">확정</option>
                                                    <option value="CLOSED">마감</option>
                                                </select>
                                                <button
                                                    onClick={() => saveVersionStatus(item)}
                                                    disabled={savingId === item.id || statusById[item.id] === item.status}
                                                    style={{
                                                        ...menuGhostBtn,
                                                        padding: '4px 10px',
                                                        fontSize: 11,
                                                        background: statusById[item.id] !== item.status ? '#2563eb' : '#fff',
                                                        color: statusById[item.id] !== item.status ? '#fff' : '#94a3b8',
                                                        border: '1px solid #cbd5e1'
                                                    }}
                                                >
                                                    저장
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ ...simpleTd, textAlign: 'center', paddingRight: 24 }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                                            <button
                                                style={{ ...menuGhostBtn, padding: '6px 14px', fontSize: 12, border: '1px solid #cbd5e1', background: '#fff' }}
                                                onClick={() => { setVersion(item); onNavigate?.('intake'); }}
                                            >
                                                자세히보기
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
