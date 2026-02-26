
import React, { useState, useEffect } from 'react';
import { Paperclip, Trash2 } from 'lucide-react';
import { menuStyles } from '../../shared/menuUi';
import { VERSION_INTAKE_STRINGS as S } from './constants';

// Destructure styles for easier use
const { simpleLabel, simpleInput, simpleSelect, simpleTextarea } = menuStyles;

export default function VersionForm({ data, setData, currentFileUrl, isCreate = false, fileInputId, transferSourceOptions }) {
    const [nameDraft, setNameDraft] = useState(data.name || '');
    const [guidelinesDraft, setGuidelinesDraft] = useState(data.guidelines || '');

    useEffect(() => {
        queueMicrotask(() => {
            setNameDraft(data.name || '');
        });
    }, [data.name]);

    useEffect(() => {
        queueMicrotask(() => {
            setGuidelinesDraft(data.guidelines || '');
        });
    }, [data.guidelines]);

    const commitField = (field, value) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 상단: 연도 + 명칭 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ ...simpleLabel, fontSize: 13, color: '#64748b' }}>{S.applyYear}</label>
                    <input type="number" style={{ ...simpleInput, borderRadius: 10, padding: '10px 14px' }} value={data.year} onChange={e => { const v = parseInt(e.target.value); setData(prev => ({ ...prev, year: v })); }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ ...simpleLabel, fontSize: 13, color: '#64748b' }}>{S.roundName}</label>
                    <input
                        style={{ ...simpleInput, borderRadius: 10, padding: '10px 14px' }}
                        placeholder={S.namePlaceholder}
                        value={nameDraft}
                        onChange={e => setNameDraft(e.target.value)}
                        onCompositionEnd={e => commitField('name', e.currentTarget.value)}
                        onBlur={e => commitField('name', e.target.value)}
                    />
                </div>
            </div>

            {/* 생성 모드 및 원본 선택 (사이드 바이 사이드) */}
            {isCreate && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: data.creation_mode === 'TRANSFER' ? '1fr 1fr' : '1fr',
                    gap: 12,
                    background: '#f8fafc',
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ ...simpleLabel, fontSize: 12, color: '#475569', fontWeight: 750 }}>{S.createMode}</label>
                        <select
                            style={{ ...simpleSelect, borderRadius: 8, padding: '8px 12px', background: '#fff' }}
                            value={data.creation_mode || 'NEW'}
                            onChange={(e) => { const v = e.target.value; setData(prev => ({ ...prev, creation_mode: v, source_version_id: v === 'TRANSFER' ? prev.source_version_id : '' })); }}
                        >
                            <option value="NEW">{S.newCreate}</option>
                            <option value="TRANSFER">{S.copyRound}</option>
                        </select>
                    </div>
                    {data.creation_mode === 'TRANSFER' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ ...simpleLabel, fontSize: 12, color: '#475569', fontWeight: 750 }}>{S.originalRound}</label>
                            <select
                                style={{ ...simpleSelect, borderRadius: 8, padding: '8px 12px', background: '#fff' }}
                                value={data.source_version_id || ''}
                                onChange={(e) => { const v = e.target.value; setData(prev => ({ ...prev, source_version_id: v })); }}
                            >
                                <option value="">{S.selectOriginal}</option>
                                {transferSourceOptions.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.year} {item.name} ({item.round ?? 0}차)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            {/* 접수 기간 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...simpleLabel, fontSize: 13, color: '#64748b' }}>{S.periodSetting}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center' }}>
                    <input type="date" style={{ ...simpleInput, borderRadius: 10, padding: '10px 14px' }} value={data.start_date} onChange={e => { const v = e.target.value; setData(prev => ({ ...prev, start_date: v })); }} />
                    <span style={{ color: '#94a3b8', fontSize: 18 }}>~</span>
                    <input type="date" style={{ ...simpleInput, borderRadius: 10, padding: '10px 14px' }} value={data.end_date} onChange={e => { const v = e.target.value; setData(prev => ({ ...prev, end_date: v })); }} />
                </div>
            </div>

            {/* 작성 지침 (높이 축소) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...simpleLabel, fontSize: 13, color: '#64748b' }}>{S.guidelinesLabel}</label>
                <textarea
                    style={{ ...simpleTextarea, height: 74, borderRadius: 10, padding: '12px 14px' }}
                    value={guidelinesDraft}
                    onChange={e => setGuidelinesDraft(e.target.value)}
                    onCompositionEnd={e => commitField('guidelines', e.currentTarget.value)}
                    onBlur={e => commitField('guidelines', e.target.value)}
                    placeholder={S.guidelinesPlaceholder}
                />
            </div>

            {/* 파일 첨부 (컴팩트 헤더 스타일) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ ...simpleLabel, fontSize: 13, color: '#64748b' }}>{S.fileUploadLabel}</label>
                <div
                    style={{
                        border: '1.5px dashed #cbd5e1',
                        borderRadius: 10,
                        padding: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        background: '#fcfdfe'
                    }}
                    onClick={() => document.getElementById(fileInputId).click()}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.background = '#f1f6ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#fcfdfe'; }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Paperclip size={18} color="#64748b" />
                        <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                            {data.file ? data.file.name : (currentFileUrl ? `${S.currentFile}${currentFileUrl.split('/').pop()}` : S.uploadPlaceholder)}
                        </div>
                    </div>
                    <input
                        id={fileInputId}
                        type="file"
                        style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files[0]; setData(prev => ({ ...prev, file: f })); }}
                    />
                    {(data.file || currentFileUrl) && (
                        <button
                            type="button"
                            style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)', background: '#fee2e2', border: 'none', cursor: 'pointer', color: '#ef4444', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={(e) => { e.stopPropagation(); setData(prev => ({ ...prev, file: null })); }}
                            title={S.removeFile}
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>
        </div>

    );
}
