import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Upload, Download, Trash2, Loader2, Plus, Paperclip } from 'lucide-react';
import { btnG, btnP, mOv, mCd } from '../uiStyles';

const uploadBtn = {
    ...btnP,
    background: '#166534',
    color: '#fff',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: 6,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
};

const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    gap: 12,
};

export default function SupportingDocsModal({
    target,
    onClose,
    authAxios,
    version,
    orgId,
    projectId,
    zIndex,
    modalApi,
}) {
    const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);
    const _confirm = (msg) => modalApi?.confirm ? modalApi.confirm(msg) : Promise.resolve(window.confirm(msg));
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const fetchDocs = useCallback(async () => {
        if (!target || !version?.id || !orgId) return;
        setLoading(true);
        try {
            const params = {
                subject: target.id,
                version: version.id,
                org: orgId,
            };
            if (projectId) params.entrusted_project = projectId;

            const response = await authAxios.get('/api/supporting-docs/', { params });
            // DRF commonly returns { results: [...] } but can also return [...]
            const data = response?.data;
            setDocs(Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []));
        } catch (error) {
            console.error('Fetch docs error:', error);
        } finally {
            setLoading(false);
        }
    }, [target, version, orgId, projectId, authAxios]);

    useEffect(() => {
        if (target) fetchDocs();
    }, [target, fetchDocs]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('subject', target.id);
                formData.append('version', version.id);
                formData.append('org', orgId);
                if (projectId) formData.append('entrusted_project', projectId);

                await authAxios.post('/api/supporting-docs/', formData);
            }
            fetchDocs();
        } catch (error) {
            console.error('Upload error:', error);
            _alert('파일 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await _confirm('이 파일을 삭제하시겠습니까?');
        if (!confirmed) return;
        try {
            await authAxios.delete(`/api/supporting-docs/${id}/`);
            setDocs((prev) => prev.filter((d) => d.id !== id));
        } catch (error) {
            console.error('Delete error:', error);
            _alert('파일 삭제 중 오류가 발생했습니다.');
        }
    };

    if (!target) return null;

    return createPortal(
        <div
            style={{
                ...mOv,
                zIndex: zIndex || 25000,
                background: 'rgba(15, 23, 42, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    ...mCd,
                    width: 640,
                    padding: 0,
                    overflow: 'hidden',
                    height: 'min(720px, 85vh)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                background: '#f0fdf4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <FileText color="#166534" size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                                근거자료 제출 및 확인
                            </h3>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: 1 }}>
                                [{target.code}] {target.name}
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            padding: 6,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#94a3b8',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        background: '#f8fafc',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', color: '#475569', fontWeight: 700 }}>
                            첨부파일 목록 <span style={{ color: '#166534', marginLeft: 2 }}>{docs.length}</span>
                        </div>
                        <button style={uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            <span>{uploading ? '업로드 중..' : '파일 추가'}</span>
                        </button>
                    </div>

                    <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileUpload} />

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                            <Loader2 size={32} color="#166534" className="animate-spin" />
                        </div>
                    ) : docs.length === 0 ? (
                        <div
                            style={{
                                padding: '80px 20px',
                                textAlign: 'center',
                                background: '#fff',
                                border: '2px dashed #e2e8f0',
                                borderRadius: 12,
                            }}
                        >
                            <FileText size={48} color="#e2e8f0" style={{ marginBottom: 16, margin: '0 auto 16px' }} />
                            <div style={{ color: '#475569', fontSize: '14px', fontWeight: 600 }}>업로드된 근거자료가 없습니다.</div>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: 4 }}>
                                사업계획서, 예산변경신청서/승인서 등을 업로드하세요.
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {docs.map((doc) => (
                                <div key={doc.id} style={rowStyle}>
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            background: '#f1f5f9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Paperclip size={20} color="#64748b" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                color: '#0f172a',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                            title={doc.filename}
                                        >
                                            {doc.filename}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: 2 }}>
                                            {doc.file_display_size} • {new Date(doc.created_at).toLocaleDateString()} • {doc.author_display}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <a
                                            href={doc.file}
                                            download={doc.filename}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 6,
                                                color: '#0f172a',
                                                background: '#fff',
                                                border: '1px solid #e2e8f0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            title="다운로드"
                                        >
                                            <Download size={16} />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(doc.id)}
                                            style={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: 6,
                                                color: '#ef4444',
                                                background: '#fff',
                                                border: '1px solid #fecaca',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            title="삭제"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '16px 24px',
                        background: '#fff',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'flex-end',
                    }}
                >
                    <button style={{ ...btnG, minWidth: 100, height: 40 }} onClick={onClose}>
                        닫기
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
