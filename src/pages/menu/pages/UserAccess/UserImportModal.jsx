
import React from 'react';

export default function UserImportModal({ isOpen, onClose, handleImportFile, importLoading, downloadTemplate }) {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '8px', padding: '24px',
                maxWidth: '400px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>
                    사용자 일괄 임포트
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                    Excel 파일을 선택하여 여러 사용자를 한 번에 임포트할 수 있습니다.
                </div>
                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportFile}
                    disabled={importLoading}
                    style={{
                        width: '100%', padding: '8px', border: '1px solid #cbd5e1',
                        borderRadius: '4px', marginBottom: '16px'
                    }}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={importLoading}
                        style={{
                            padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '4px',
                            backgroundColor: '#f8fafc', cursor: 'pointer', fontSize: '13px'
                        }}
                    >
                        취소
                    </button>
                    <button
                        type="button"
                        onClick={downloadTemplate}
                        style={{
                            padding: '8px 16px', border: 'none', borderRadius: '4px',
                            backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '13px'
                        }}
                    >
                        템플릿 다운로드
                    </button>
                </div>
            </div>
        </div>
    );
}
