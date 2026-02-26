import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { apiErrorMessage as apiMsg } from '../../traditionalLedger/shared';

export default function SnapshotPanel({ typeTab, authAxios, onRefresh }) {
    const [restoring, setRestoring] = useState(false);

    const restoreDefaults = async () => {
        const typeLabel = typeTab === 'income' ? '수입' : '지출';
        if (!window.confirm(`${typeLabel} 예산 계정체제를 기본값으로 되돌리시겠습니까?\n현재 구조를 기본 템플릿으로 교체합니다.`)) {
            return;
        }
        setRestoring(true);
        try {
            const response = await authAxios.post('/api/subjects/restore-defaults/', {
                subject_type: typeTab,
            });
            await onRefresh();
            const data = response?.data || {};
            alert(
                `기본값 복원이 완료되었습니다.\n`
                + `생성: ${Number(data.created || 0)}건, `
                + `갱신: ${Number(data.updated || 0)}건, `
                + `삭제: ${Number(data.deleted || 0)}건`
                + (Number(data.skipped || 0) > 0 ? `\n보호되어 유지된 항목: ${Number(data.skipped || 0)}건` : '')
            );
        } catch (e) {
            alert(apiMsg(e, '기본값 복원 중 오류가 발생했습니다.'));
        } finally {
            setRestoring(false);
        }
    };

    const typeLabel = typeTab === 'income' ? '수입' : '지출';

    return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RotateCcw size={14} color="#64748b" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>기본값 복원</span>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                            JSON 기본 템플릿 기준으로 현재 {typeLabel} 계정체제를 되돌립니다.
                        </span>
                    </div>
                </div>
                <button
                    onClick={restoreDefaults}
                    disabled={restoring}
                    style={{
                        background: restoring ? '#93c5fd' : '#1d4ed8',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 7,
                        padding: '7px 14px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: restoring ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {restoring ? '복원 중...' : `${typeLabel} 기본값 복원`}
                </button>
            </div>
        </div>
    );
}
