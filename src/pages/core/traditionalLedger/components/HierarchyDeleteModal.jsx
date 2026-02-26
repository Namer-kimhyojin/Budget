import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { btnG, btnP, mOv, mCd } from '../uiStyles';

const dangerBtn = {
    ...btnP,
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    fontSize: '14px',
    fontWeight: 700,
    padding: '12px',
    cursor: 'pointer',
    borderRadius: 8,
    transition: 'all 0.2s',
};

const disabledDangerBtn = {
    ...dangerBtn,
    background: '#fecaca',
    cursor: 'not-allowed',
};

export default function HierarchyDeleteModal({
    targetSubject,
    linkedEntries,
    onClose,
    onConfirm,
    overlayZIndex,
}) {
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    if (!targetSubject) return null;

    const handleConfirm = async () => {
        if (confirmText !== 'DELETE') return;
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
        }
    };

    return createPortal(
        <div
            style={{
                ...mOv,
                zIndex: overlayZIndex || 25000,
                background: 'rgba(15, 23, 42, 0.7)', // Slightly darker for better focus
                pointerEvents: 'auto'
            }}
            onClick={onClose}
        >
            <div
                style={{ ...mCd, width: 480, padding: 0, overflow: 'hidden' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#fff',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle color="#ef4444" size={20} />
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' }}>
                            항목 삭제 확인
                        </h3>
                    </div>
                    <X size={20} onClick={onClose} style={{ cursor: 'pointer', color: '#64748b' }} />
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
                        <div>
                            <strong>"{targetSubject.name}"</strong> 항목과 그 하위 항목들이 모두 영구적으로 삭제됩니다.
                        </div>
                        {linkedEntries.length > 0 ? (
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: 12,
                                    background: '#fef2f2',
                                    border: '1px solid #fee2e2',
                                    borderRadius: 8,
                                    color: '#b91c1c',
                                }}
                            >
                                <strong>⚠ 삭제 불가</strong> — 이 과목(또는 하위 과목)에 연결된 예산 데이터가 <strong>{linkedEntries.length}개</strong> 있습니다.
                                <div style={{ marginTop: 6, fontSize: '12px' }}>
                                    예산 대장에서 해당 항목을 먼저 삭제한 후 다시 시도해주세요.
                                </div>
                            </div>
                        ) : (
                            <div
                                style={{
                                    marginTop: 12,
                                    padding: 12,
                                    background: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: 8,
                                    color: '#166534',
                                    fontSize: '13px',
                                }}
                            >
                                연결된 예산 데이터가 없습니다. 과목 체계만 삭제됩니다.
                            </div>
                        )}
                    </div>

                    {linkedEntries.length === 0 && (
                        <div style={{ marginTop: 8 }}>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#b91c1c',
                                    marginBottom: 6,
                                }}
                            >
                                삭제하시려면 대문자로 "DELETE"를 입력해주세요.
                            </label>
                            <input
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 8,
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                placeholder="DELETE"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && confirmText === 'DELETE') handleConfirm();
                                }}
                            />
                        </div>
                    )}
                </div>

                <div
                    style={{
                        padding: '20px 24px',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        gap: 12,
                    }}
                >
                    <button style={{ ...btnG, flex: 1, height: 44 }} onClick={onClose}>
                        {linkedEntries.length > 0 ? '닫기' : '취소'}
                    </button>
                    {linkedEntries.length === 0 && (
                        <button
                            style={{
                                ...(confirmText === 'DELETE' ? dangerBtn : disabledDangerBtn),
                                flex: 1.5,
                                height: 44,
                                opacity: isDeleting ? 0.7 : 1,
                            }}
                            disabled={confirmText !== 'DELETE' || isDeleting}
                            onClick={handleConfirm}
                        >
                            {isDeleting ? '삭제 중...' : '확인 및 삭제'}
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
