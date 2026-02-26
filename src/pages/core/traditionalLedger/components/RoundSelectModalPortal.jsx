import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CalendarDays, Clock, CheckCircle2, Building2, Users, FileText } from 'lucide-react';
import {
  plannerSectionTitle,
  plannerStatusPill,
  plannerStatusPillOpen,
  plannerSelectGrid,
  plannerFieldBlock,
  plannerFieldLabel,
  plannerSelect,
  plannerModalBackdrop,
  plannerModalCard,
  plannerModalHead,
  plannerModalTitle,
  plannerModalSubTitle,
  plannerModalBody,
  plannerVersionList,
  plannerVersionItem,
  plannerVersionItemActive,
  plannerVersionTop,
  plannerVersionName,
  plannerVersionMeta,
  plannerModalScope,
  plannerModalEmpty,
} from '../styles';

function deadlineColor(deadlineText) {
  if (!deadlineText || deadlineText === '-') return { color: '#64748b' };
  if (deadlineText.includes('D-Day') || deadlineText.includes('초과')) return { color: '#dc2626', fontWeight: 700 };
  const match = deadlineText.match(/D-(\d+)/);
  if (match) {
    const days = Number(match[1]);
    if (days <= 3) return { color: '#ea580c', fontWeight: 700 };
  }
  if (deadlineText.includes('시작 전')) return { color: '#7c3aed' };
  return { color: '#2563eb' };
}

const inferBackendOrigin = () => {
  if (typeof window === 'undefined') return '';
  if (window.location.port === '5173') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return window.location.origin;
};

const resolveAttachmentUrl = (rawUrl) => {
  const value = String(rawUrl || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  const base = inferBackendOrigin();
  if (!base) return value;
  return value.startsWith('/') ? `${base}${value}` : `${base}/${value}`;
};

const extractFileName = (urlLike, fallback = '첨부파일') => {
  const raw = String(urlLike || '').trim();
  if (!raw) return fallback;
  const lastSegment = raw.split('/').pop() || fallback;
  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
};

const buildGuidelineAttachments = (target) => {
  if (!target) return [];
  const items = [];
  const baseName = String(target.guidelines_file_name || '').trim();
  const pushItem = (url, name) => {
    const normalized = resolveAttachmentUrl(url);
    if (!normalized) return;
    items.push({
      id: `${normalized}|${name || ''}`,
      name: name || extractFileName(normalized),
      url: normalized,
    });
  };

  if (Array.isArray(target.guidelines_files)) {
    target.guidelines_files.forEach((file, idx) => {
      if (!file) return;
      if (typeof file === 'string') {
        pushItem(file, '');
        return;
      }
      pushItem(file.url || file.file || file.path, file.name || file.filename || `첨부파일 ${idx + 1}`);
    });
  } else if (target.guidelines_file) {
    pushItem(target.guidelines_file, baseName);
  }

  return items;
};

const ROUND_SELECT_MODAL_CSS = `
  .planner-version-item {
    -webkit-tap-highlight-color: transparent;
    -webkit-appearance: none !important;
    appearance: none !important;
    forced-color-adjust: none;
    border: 1.5px solid #d6e2ef !important;
    outline: none !important;
    box-shadow: none !important;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .planner-version-item::-moz-focus-inner {
    border: 0 !important;
    outline: none !important;
  }
  .planner-version-item:focus,
  .planner-version-item:active,
  .planner-version-item:focus-visible,
  .planner-version-item:focus-within {
    outline: 0 !important;
    outline: none !important;
    outline-offset: 0 !important;
    box-shadow: none !important;
    border-color: #d6e2ef !important;
  }
  .planner-version-item.active:focus,
  .planner-version-item.active:active,
  .planner-version-item.active:focus-visible,
  .planner-version-item.active:focus-within {
    outline: 0 !important;
    outline-offset: 0 !important;
    border-color: #2563eb !important;
    box-shadow: 0 10px 25px -10px rgba(37,99,235,0.3) !important;
  }
  .planner-version-item:hover {
    background: #f8fafc !important;
    border-color: #cbd5e1 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }
  .planner-version-item.active {
    background: #eff6ff !important;
    border-color: #2563eb !important;
    transform: none !important;
    box-shadow: 0 10px 25px -10px rgba(37,99,235,0.3) !important;
    z-index: 1;
  }


`;

export default function RoundSelectModalPortal({
  isOpen,
  zIndex,
  inputAvailableVersions,
  versionRelatedInfo,
  modalVersionId,
  onVersionChange,
  modalDeptId,
  onDeptChange,
  isAdminUser,
  selectableDepartments,
  modalTeamId,
  onTeamChange,
  modalSelectableTeams,
  onClose,
  onApply,
}) {
  const [guidelineModalVersion, setGuidelineModalVersion] = useState(null);
  if (!isOpen) return null;

  const selectedVersion = inputAvailableVersions.find(v => Number(v.id) === Number(modalVersionId));
  const selectedInfo = selectedVersion ? versionRelatedInfo(selectedVersion) : null;

  const selectedDept = selectableDepartments.find(o => String(o.id) === String(modalDeptId));
  const selectedTeam = modalTeamId ? modalSelectableTeams.find(t => String(t.id) === String(modalTeamId)) : null;
  const guidelineModalAttachments = buildGuidelineAttachments(guidelineModalVersion);

  return createPortal(
    <div style={{ ...plannerModalBackdrop, zIndex }} onClick={onClose}>
      <style>{ROUND_SELECT_MODAL_CSS}</style>
      <div style={plannerModalCard} onClick={e => e.stopPropagation()}>


        {/* Header */}
        <div style={plannerModalHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37,99,235,.3)',
            }}>
              <CalendarDays size={20} color="#fff" />
            </div>
            <div>
              <div style={plannerModalTitle}>입력 회차 선택</div>
              <div style={plannerModalSubTitle}>입력 가능한 회차와 범위를 선택해 주세요.</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: 'none', borderRadius: 8,
              width: 30, height: 30, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#94a3b8', transition: 'background .15s',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={plannerModalBody}>

          {/* Left: version list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ ...plannerSectionTitle, marginBottom: 6 }}>회차 선택</div>
            <div style={plannerVersionList}>
              {inputAvailableVersions.length === 0 && (
                <div style={plannerModalEmpty}>
                  현재 입력 가능한 회차(PENDING)가 없습니다.
                </div>
              )}
              {inputAvailableVersions.map(v => {
                const info = versionRelatedInfo(v);
                const active = Number(modalVersionId) === Number(v.id);
                const dColor = deadlineColor(info.deadlineText);
                const hasGuidelineInfo = Boolean(String(v.guidelines || '').trim() || v.guidelines_file);
                return (
                  <div
                    key={v.id}
                    role="button"
                    tabIndex={0}
                    className={`planner-version-item ${active ? 'active' : ''}`}
                    style={{ ...plannerVersionItem, ...(active ? plannerVersionItemActive : null) }}
                    onClick={() => onVersionChange(String(v.id))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onVersionChange(String(v.id));
                      }
                    }}
                  >


                    <div style={plannerVersionTop}>
                      <span style={plannerVersionName}>{v.year}년 {v.name}</span>
                      <span style={{ ...plannerStatusPill, ...plannerStatusPillOpen }}>입력 가능</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...plannerVersionMeta }}>
                        <CalendarDays size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                        <span>{info.periodText}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...plannerVersionMeta, ...dColor }}>
                        <Clock size={13} color={dColor.color} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: 800 }}>{info.deadlineText}</span>
                      </div>
                      {hasGuidelineInfo && (
                        <div style={{ display: 'flex', marginTop: 2 }}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setGuidelineModalVersion(v);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              fontSize: '11px',
                              fontWeight: 700,
                              borderRadius: 7,
                              padding: '4px 8px',
                              cursor: 'pointer',
                            }}
                          >
                            <FileText size={12} />
                            작성지침 보기
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );

              })}
            </div>
          </div>

          {/* Right: scope */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ ...plannerSectionTitle, marginBottom: 2 }}>입력 범위 선택</div>
            <div style={plannerModalScope}>
              <div style={plannerSelectGrid}>
                <label style={plannerFieldBlock}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...plannerFieldLabel }}>
                    <Building2 size={11} color="#64748b" />부서
                  </span>
                  <select
                    style={plannerSelect}
                    value={modalDeptId}
                    onChange={e => onDeptChange(e.target.value)}
                    disabled={!isAdminUser}
                  >
                    {selectableDepartments.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </label>
                <label style={plannerFieldBlock}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, ...plannerFieldLabel }}>
                    <Users size={11} color="#64748b" />팀 범위
                  </span>
                  <select
                    style={plannerSelect}
                    value={modalTeamId}
                    onChange={e => onTeamChange(e.target.value)}
                  >
                    <option value="">부서 전체</option>
                    {modalSelectableTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </label>
              </div>

              {/* Selected version summary */}
              {selectedVersion && selectedInfo && (
                <div style={{
                  marginTop: 4,
                  background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#2563eb', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                    선택된 회차
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a', marginBottom: 6 }}>
                    {selectedVersion.year}년 {selectedVersion.name}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#475569' }}>
                      <CalendarDays size={11} color="#3b82f6" />
                      <span>{selectedInfo.periodText}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', ...deadlineColor(selectedInfo.deadlineText) }}>
                      <Clock size={11} color={deadlineColor(selectedInfo.deadlineText).color} />
                      <span>{selectedInfo.deadlineText}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#475569' }}>
                      <CheckCircle2 size={11} color="#10b981" />
                      <span>{selectedDept?.name ?? '—'}{selectedTeam ? ` / ${selectedTeam.name}` : ' (부서 전체)'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                marginTop: 4,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
              }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 18px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: 8,
                    border: '1.5px solid #e2e8f0',
                    background: '#fff',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={onApply}
                  disabled={!selectedVersion}
                  style={{
                    padding: '9px 22px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: 8,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#fff',
                    cursor: selectedVersion ? 'pointer' : 'not-allowed',
                    opacity: selectedVersion ? 1 : 0.55,
                    boxShadow: '0 4px 12px rgba(37,99,235,.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={14} />
                  예산입력 실행
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {guidelineModalVersion && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: zIndex + 2,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(event) => {
            event.stopPropagation();
            setGuidelineModalVersion(null);
          }}
        >
          <div
            style={{
              width: 'min(560px, 96vw)',
              maxHeight: '80vh',
              overflow: 'hidden',
              borderRadius: 12,
              border: '1px solid #dbeafe',
              background: '#fff',
              boxShadow: '0 24px 48px rgba(15, 23, 42, 0.28)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <FileText size={15} color="#1d4ed8" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a' }}>
                  작성지침
                </span>
              </div>
              <button
                type="button"
                onClick={() => setGuidelineModalVersion(null)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{
              padding: '12px 14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              {String(guidelineModalVersion.guidelines || '').trim() ? (
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  fontSize: '13px',
                  color: '#1e293b',
                  border: '1px solid #e2e8f0',
                  borderRadius: 9,
                  background: '#f8fafc',
                  padding: '11px 12px',
                }}>
                  {guidelineModalVersion.guidelines}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>등록된 작성 지침이 없습니다.</div>
              )}

              {guidelineModalAttachments.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  border: '1px solid #dbeafe',
                  borderRadius: 9,
                  background: '#f8fbff',
                  padding: '10px 11px',
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={12} />
                    첨부파일 목록 ({guidelineModalAttachments.length})
                  </div>
                  {guidelineModalAttachments.map((file, index) => (
                    <div
                      key={file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '7px 8px',
                        borderRadius: 8,
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <span style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '12px',
                        color: '#334155',
                      }}>
                        {index + 1}. {file.name}
                      </span>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        download={file.name}
                        style={{
                          textDecoration: 'none',
                          border: '1px solid #bfdbfe',
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          borderRadius: 7,
                          padding: '5px 9px',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        다운로드
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
