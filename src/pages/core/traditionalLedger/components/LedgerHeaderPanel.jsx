// Forced update for UI icons
import React, { useMemo, useState } from 'react';
import { Download, Plus, Save, Lock, Unlock, FileText, Paperclip, Clock, Eye, EyeOff, X } from 'lucide-react';
import { COLORS, numInThousand, varianceNumInThousand } from '../shared';
import { VERSION_STATUS_LABELS } from '../../../menu/config';
import { btnWhite, btnPlus } from '../styles';

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

export default function LedgerHeaderPanel({
  version,
  isVersionEditable,
  selectedDeptName,
  selectedVersionPeriod,
  embeddedMode,
  openRoundSelectModal,
  incTotal,
  expTotal,
  isBalanced,
  diffTotal,
  inputProgressRatio,
  enteredCount,
  totalEditableCount,
  onRefresh,
  modalApi,
  exportToExcel,
  pushToast,
  versionLockMessage,
  setIsAddOpen,
  versionStatusLabel,
  user,
  authAxios,
  onVersionStatusChange,
  showMyEntries,
  setShowMyEntries,
  hiddenCols = {},
  toggleCol,
  applyColPreset,
  showTransferColumns = false,
  showSyncControls = false,
  isSyncRefreshing = false,
  lastSyncedAt = null,
  lastConflictAt = null,
  autoRefreshEnabled = false,
  setAutoRefreshEnabled,
  onRefreshNow,
}) {
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'REVIEWER';
  const isClosed = version?.status === 'CLOSED';
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);
  const hasGuidelines = Boolean(version?.guidelines || version?.guidelines_file);
  const guidelineAttachments = useMemo(() => buildGuidelineAttachments(version), [version]);

  const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (typeof data?.error === 'string' && data.error.trim()) return data.error;
    return fallback;
  };

  const handleClose = async () => {
    if (!version?.id || isStatusSubmitting) return;
    const confirmed = await modalApi.confirm(
      `"${version.name}" 회차를 마감할까요?\n마감 후에는 해당 회차의 모든 편집이 잠깁니다.`,
      '회차 마감 확인',
    );
    if (!confirmed) return;
    setIsStatusSubmitting(true);
    try {
      const res = await authAxios.post(`/api/versions/${version.id}/close/`);
      const updatedVersion = res?.data?.version || { ...version, status: 'CLOSED' };
      onVersionStatusChange?.(updatedVersion);
      await onRefresh?.(updatedVersion);
      await modalApi.alert(
        `"${version.name}" 회차가 마감되었습니다.\n이제 이 회차는 수정할 수 없습니다.`,
        '회차 마감 완료',
      );
    } catch (error) {
      await modalApi.alert(getErrorMessage(error, '마감 처리 중 오류가 발생했습니다.'), '마감 실패');
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  const handleReopen = async () => {
    if (!version?.id || isStatusSubmitting) return;
    const confirmed = await modalApi.confirm(
      `"${version.name}" 회차의 마감을 해제할까요?\n해제 후에는 다시 편집할 수 있습니다.`,
      '회차 마감 해제 확인',
    );
    if (!confirmed) return;
    setIsStatusSubmitting(true);
    try {
      const res = await authAxios.post(`/api/versions/${version.id}/reopen/`);
      const updatedVersion = res?.data?.version || { ...version, status: 'PENDING' };
      onVersionStatusChange?.(updatedVersion);
      await onRefresh?.(updatedVersion);
      await modalApi.alert(
        `"${version.name}" 회차의 마감이 해제되었습니다.\n이제 이 회차를 다시 편집할 수 있습니다.`,
        '회차 마감 해제 완료',
      );
    } catch (error) {
      await modalApi.alert(getErrorMessage(error, '마감 해제 중 오류가 발생했습니다.'), '마감 해제 실패');
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  // Deadline color
  const deadlineText = selectedVersionPeriod.deadlineText || '';
  const isDDay = deadlineText.includes('D-Day');
  const isOverdue = deadlineText.includes('마감 +');
  const deadlineBg = isDDay ? '#fef2f2' : isOverdue ? '#f1f5f9' : '#fffbeb';
  const deadlineColor = isDDay ? '#b91c1c' : isOverdue ? '#64748b' : '#b45309';
  const formatClock = (ts) => {
    if (!ts) return '-';
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('ko-KR', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };
  const formatElapsed = (ts) => {
    if (!ts) return '';
    const gapMs = Date.now() - new Date(ts).getTime();
    if (!Number.isFinite(gapMs) || gapMs < 0) return '';
    const minute = Math.floor(gapMs / 60000);
    if (minute < 1) return '방금 전';
    if (minute < 60) return `${minute}분 전`;
    const hour = Math.floor(minute / 60);
    return `${hour}시간 전`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}>

        {/* Row 1: Version info + Actions */}
        <div style={{
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          flexWrap: 'wrap',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)',
          borderBottom: '1px solid #e8ecf4',
        }}>
          {/* Left: Version name + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {version ? `${version.year}년 ${version.name}` : '회차 미선택'}
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: 6,
              background: isVersionEditable ? '#dcfce7' : (version?.status === 'EXPIRED' ? '#ffedd5' : '#fef3c7'),
              color: isVersionEditable ? '#166534' : (version?.status === 'EXPIRED' ? '#c2410c' : '#92400e'),
              border: `1px solid ${isVersionEditable ? '#bbf7d0' : (version?.status === 'EXPIRED' ? '#fdba74' : '#fde68a')}`,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              {version?.status === 'EXPIRED' ? (
                <Clock size={12} style={{ marginRight: 2 }} />
              ) : (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: isVersionEditable ? '#166534' : '#b45309',
                  display: 'inline-block'
                }} />
              )}
              {VERSION_STATUS_LABELS[version?.status] || version?.status || '준비중'}
              {!isVersionEditable && version?.status !== 'EXPIRED' && <Lock size={10} style={{ marginLeft: 2, opacity: 0.8 }} />}
            </span>

            {/* Meta info */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
              padding: '3px 0 3px 12px', borderLeft: '2px solid #e2e8f0',
            }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                <span style={{ color: '#94a3b8', marginRight: 3 }}>Dept</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedDeptName}</span>
              </span>
              <span style={{ color: '#d1d5db', fontSize: '10px' }}>|</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                <span style={{ color: '#94a3b8', marginRight: 3 }}>Period</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{selectedVersionPeriod.periodText}</span>
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                background: deadlineBg, color: deadlineColor,
              }}>
                {deadlineText}
              </span>
            </div>
          </div>

          {/* Right: Round change + Close buttons */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* 회차 마감/해제 - admin/manager only */}
            {version && isAdmin && !embeddedMode && (
              !isClosed ? (
                <button
                  type="button"
                  disabled={isStatusSubmitting}
                  onClick={handleClose}
                  style={{
                    padding: '6px 12px', borderRadius: 7,
                    border: '1px solid #fca5a5', background: '#fff1f2',
                    color: '#b91c1c', fontSize: '12px', fontWeight: 700,
                    cursor: isStatusSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isStatusSubmitting ? 0.65 : 1,
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                >
                  <Lock size={12} /> {isStatusSubmitting ? '처리 중...' : '회차 마감'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isStatusSubmitting}
                  onClick={handleReopen}
                  style={{
                    padding: '6px 12px', borderRadius: 7,
                    border: '1px solid #86efac', background: '#f0fdf4',
                    color: '#166534', fontSize: '12px', fontWeight: 700,
                    cursor: isStatusSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isStatusSubmitting ? 0.65 : 1,
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                >
                  <Unlock size={12} /> {isStatusSubmitting ? '처리 중...' : '마감 해제'}
                </button>
              )
            )}
            {!embeddedMode && (
              <button
                style={{
                  ...btnWhite, padding: '6px 14px', fontSize: '12px',
                  gap: 6, alignItems: 'center', display: 'flex',
                  fontWeight: 700,
                }}
                onClick={openRoundSelectModal}
              >
                ⇄ 회차/범위 변경
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Summary metrics + Action buttons */}
        <div style={{
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          flexWrap: 'wrap',
        }}>
          {/* Left: Financial summary cards */}
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {/* 수입 */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '6px 20px 6px 0', borderRight: '1px solid #e2e8f0',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, color: COLORS.income,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>수입</span>
              <span style={{
                fontSize: '16px', fontWeight: 800, color: COLORS.income,
                fontVariantNumeric: 'tabular-nums',
              }}>{numInThousand(incTotal)}</span>
            </div>
            {/* 지출 */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '6px 20px', borderRight: '1px solid #e2e8f0',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, color: COLORS.expense,
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>지출</span>
              <span style={{
                fontSize: '16px', fontWeight: 800, color: COLORS.expense,
                fontVariantNumeric: 'tabular-nums',
              }}>{numInThousand(expTotal)}</span>
            </div>
            {/* 차액 */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '6px 20px', borderRight: '1px solid #e2e8f0',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, color: '#94a3b8',
                letterSpacing: '0.06em',
              }}>차액</span>
              <span style={{
                fontSize: '16px', fontWeight: 800,
                color: isBalanced ? '#059669' : '#dc2626',
                fontVariantNumeric: 'tabular-nums',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {isBalanced ? (
                  <><span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 18, height: 18, borderRadius: '50%', background: '#dcfce7',
                    fontSize: '11px',
                  }}>✓</span> 균형</>
                ) : varianceNumInThousand(diffTotal)}
              </span>
            </div>
            {/* 진행률 */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 4,
              padding: '6px 0 6px 20px', minWidth: 140,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em',
                }}>입력 진행률</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                  {inputProgressRatio}%
                  <span style={{ fontWeight: 500, color: '#94a3b8', fontSize: '10px', marginLeft: 3 }}>
                    ({enteredCount}/{totalEditableCount})
                  </span>
                </span>
              </div>
              <div style={{
                height: 6, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  background: inputProgressRatio === 100
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'linear-gradient(90deg, #60a5fa, #3b82f6)',
                  width: `${inputProgressRatio}%`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#334155',
              padding: '6px 12px', background: showMyEntries ? '#eff6ff' : '#f8fafc',
              border: `1px solid ${showMyEntries ? '#bfdbfe' : '#e2e8f0'}`,
              borderRadius: 8, transition: 'all 0.15s', marginRight: 4
            }}>
              <input
                type="checkbox"
                checked={!!showMyEntries}
                onChange={e => setShowMyEntries(e.target.checked)}
                style={{ cursor: 'pointer', margin: 0, width: 14, height: 14, accentColor: COLORS.blue }}
              />
              내가 입력한 항목만 보기
            </label>
            <button
              style={{
                ...btnWhite, padding: '7px 14px', fontSize: '12px',
                gap: 5, alignItems: 'center', display: 'flex',
                opacity: isSyncRefreshing ? 0.65 : 1,
                cursor: isSyncRefreshing ? 'not-allowed' : 'pointer',
              }}
              disabled={isSyncRefreshing}
              onClick={() => {
                if (onRefreshNow) onRefreshNow();
                else onRefresh();
              }}
            >
              <Save size={13} /> 동기화
            </button>
            <button
              style={{
                ...btnWhite, padding: '7px 14px', fontSize: '12px',
                gap: 5, alignItems: 'center', display: 'flex',
              }}
              onClick={exportToExcel}
            >
              <Download size={13} /> 엑셀
            </button>
            {hasGuidelines && (
              <button
                type="button"
                style={{
                  ...btnWhite, padding: '7px 14px', fontSize: '12px',
                  gap: 5, alignItems: 'center', display: 'flex',
                  borderColor: '#bfdbfe', background: '#eff6ff', color: '#1d4ed8',
                }}
                onClick={() => setIsGuidelineModalOpen(true)}
              >
                <FileText size={13} /> 지침보기
              </button>
            )}
            <button
              style={{
                ...btnPlus, padding: '7px 16px', fontSize: '12px',
                gap: 5, alignItems: 'center', display: 'flex',
                opacity: isVersionEditable ? 1 : 0.45,
                cursor: isVersionEditable ? 'pointer' : 'not-allowed',
              }}
              disabled={!isVersionEditable}
              onClick={() => {
                if (!isVersionEditable) { pushToast(versionLockMessage, 'error'); return; }
                setIsAddOpen(true);
              }}
            >
              <Plus size={13} /> 항목 추가
            </button>
          </div>
        </div>

        {/* Row 3: 열 표시/프리셋 컨트롤 */}
        {toggleCol && (
          <div style={{
            padding: '8px 20px', borderTop: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
            background: '#fafbfc',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginRight: 4, letterSpacing: '0.04em' }}>
              열 표시
            </span>
            {[
              { key: 'jang', label: '장' },
              { key: 'gwan', label: '관' },
              { key: 'hang', label: '항' },
              { key: 'mok', label: '목' },
              { key: 'budget', label: '예산액' },
              ...(showTransferColumns ? [{ key: 'base', label: '당초예산액' }, { key: 'diff', label: '증감액' }] : []),
            ].map(({ key, label }) => {
              const hidden = hiddenCols[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleCol(key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: '11px', fontWeight: 600,
                    padding: '3px 9px', borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${hidden ? '#e2e8f0' : '#bfdbfe'}`,
                    background: hidden ? '#f1f5f9' : '#eff6ff',
                    color: hidden ? '#94a3b8' : '#1d4ed8',
                    transition: 'all 0.12s',
                  }}
                >
                  {hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                  {label}
                </button>
              );
            })}
            <span style={{ width: 1, height: 18, background: '#e2e8f0', margin: '0 4px' }} />
            <button
              onClick={() => applyColPreset('compact')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: '11px', fontWeight: 700,
                padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e',
                transition: 'all 0.12s',
              }}
            >
              ⚡ 간략보기
            </button>
            <button
              onClick={() => applyColPreset('reset')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: '11px', fontWeight: 600,
                padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b',
                transition: 'all 0.12s',
              }}
            >
              전체 표시
            </button>
          </div>
        )}
        {showSyncControls && (
          <div style={{
            padding: '8px 20px', borderTop: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            flexWrap: 'wrap',
            background: '#ffffff',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>협업 동기화</span>
              <span style={{
                fontSize: '11px', color: '#475569', padding: '3px 8px', borderRadius: 999,
                border: '1px solid #e2e8f0', background: '#f8fafc',
              }}>
                마지막 동기화 {formatClock(lastSyncedAt)}
              </span>
              {lastConflictAt && (
                <span style={{
                  fontSize: '11px', color: '#b45309', padding: '3px 8px', borderRadius: 999,
                  border: '1px solid #fde68a', background: '#fffbeb',
                }}>
                  최근 충돌 {formatClock(lastConflictAt)} ({formatElapsed(lastConflictAt)})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: '11px', fontWeight: 600, color: '#334155', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={!!autoRefreshEnabled}
                  onChange={(event) => setAutoRefreshEnabled?.(event.target.checked)}
                  style={{ margin: 0, width: 13, height: 13, accentColor: COLORS.blue }}
                />
                자동 새로고침
              </label>
              <button
                type="button"
                onClick={() => onRefreshNow?.()}
                disabled={isSyncRefreshing}
                style={{
                  ...btnWhite,
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  opacity: isSyncRefreshing ? 0.65 : 1,
                  cursor: isSyncRefreshing ? 'not-allowed' : 'pointer',
                }}
              >
                {isSyncRefreshing ? '동기화 중...' : '지금 동기화'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lock warning banner */}
      {!isVersionEditable && (
        <div style={{
          padding: '8px 14px', borderRadius: 8, marginTop: 8,
          border: '1px solid #fde68a', background: '#fffbeb',
          color: '#92400e', fontSize: '11px', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Lock size={12} />
          <span>회차 잠금 — 현재 상태: <strong>{versionStatusLabel[version?.status] || version?.status || '-'}</strong>. 대기(PENDING) 상태 회차에서만 입력·수정·삭제할 수 있습니다.</span>
        </div>
      )}
      {hasGuidelines && isGuidelineModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 12030,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setIsGuidelineModalOpen(false)}
        >
          <div
            style={{
              width: 'min(640px, 96vw)',
              maxHeight: '84vh',
              overflow: 'hidden',
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #dbeafe',
              boxShadow: '0 24px 48px rgba(15, 23, 42, 0.28)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              background: 'linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color="#1d4ed8" />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#1e3a8a' }}>작성 지침 안내</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{version?.year}년 {version?.name}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuidelineModalOpen(false)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  color: '#64748b',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{ padding: '14px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {version?.guidelines ? (
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.7,
                  fontSize: '13px',
                  color: '#1e293b',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  background: '#f8fafc',
                  padding: '12px 13px',
                }}>
                  {version.guidelines}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>등록된 작성 지침이 없습니다.</div>
              )}
              {guidelineAttachments.length > 0 && (
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
                    <Paperclip size={12} />
                    첨부파일 목록 ({guidelineAttachments.length})
                  </div>
                  {guidelineAttachments.map((file, index) => (
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
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}>
              <button
                type="button"
                onClick={() => setIsGuidelineModalOpen(false)}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  borderRadius: 8,
                  padding: '8px 13px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
