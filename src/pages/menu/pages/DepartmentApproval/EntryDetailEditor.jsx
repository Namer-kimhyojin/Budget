import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  History,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { menuStyles, StatusBadge, EmptyState } from '../../shared/menuUi';
import { apiErrorMessage, num } from '../../shared/utils';
import {
  STATUS_LABELS,
  REASON_TAGS,
  formatLogDateTime,
  isRejectLog,
  normalizeReason,
} from './helpers';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleInput } = menuStyles;

const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
const thStyle = {
  padding: '8px 10px',
  borderBottom: '1px solid #e2e8f0',
  background: '#f8fafc',
  color: '#475569',
  fontWeight: 700,
  textAlign: 'left',
  whiteSpace: 'nowrap',
};
const tdStyle = {
  padding: '7px 10px',
  borderBottom: '1px solid #f1f5f9',
  color: '#1e293b',
  verticalAlign: 'middle',
};
const inputStyle = {
  ...simpleInput,
  height: 30,
  fontSize: 12,
  padding: '5px 7px',
};

const actionBtn = (color, bg, border, disabled = false) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  border: `1px solid ${disabled ? '#e2e8f0' : border}`,
  borderRadius: 7,
  background: disabled ? '#f8fafc' : bg,
  color: disabled ? '#cbd5e1' : color,
  fontSize: 11,
  fontWeight: 700,
  padding: '5px 10px',
  cursor: disabled ? 'not-allowed' : 'pointer',
  whiteSpace: 'nowrap',
});

function WorkflowReasonModal({
  title,
  value,
  required = true,
  confirmLabel,
  onChange,
  onConfirm,
  onCancel,
}) {
  const [error, setError] = useState('');

  const submit = () => {
    if (required && !normalizeReason(value)) {
      setError('사유를 입력해주세요.');
      return;
    }
    setError('');
    onConfirm();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 19000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.45)' }}>
      <div style={{ width: 420, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 14, boxShadow: '0 20px 40px -12px rgba(15,23,42,0.45)', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 14, color: '#0f172a' }}>{title}</strong>
          <button type="button" onClick={onCancel} style={{ width: 24, height: 24, border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 700, color: '#64748b' }}>
            사유 {required ? <span style={{ color: '#dc2626' }}>*</span> : null}
          </label>
          <textarea
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              if (error) setError('');
            }}
            rows={4}
            placeholder="사유를 입력하세요."
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${error ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
          />
          {error ? <div style={{ marginTop: 4, fontSize: 11, color: '#b91c1c' }}>{error}</div> : null}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" style={actionBtn('#64748b', '#f8fafc', '#e2e8f0')} onClick={onCancel}>취소</button>
          <button type="button" style={actionBtn('#ffffff', '#1d4ed8', '#1d4ed8')} onClick={submit}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

function LogModal({ logs, subjectLabel, onClose }) {
  const [tab, setTab] = useState('change');
  const changeLogs = logs.filter(log => !isRejectLog(log));
  const rejectLogs = logs.filter(log => isRejectLog(log));
  const showLogs = tab === 'reject' ? rejectLogs : changeLogs;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 19000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.35)' }}>
      <div style={{ width: 520, maxWidth: 'calc(100vw - 24px)', maxHeight: '80vh', background: '#fff', borderRadius: 14, boxShadow: '0 20px 40px -12px rgba(15,23,42,0.45)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 13, color: '#0f172a' }}>처리 로그</strong>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{subjectLabel}</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={15} />
          </button>
        </div>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
          {[
            ['change', `변경 로그 (${changeLogs.length})`],
            ['reject', `반려 의견 (${rejectLogs.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                background: 'none',
                borderBottom: tab === key ? '2px solid #1d4ed8' : '2px solid transparent',
                color: tab === key ? '#1d4ed8' : '#64748b',
                fontWeight: tab === key ? 700 : 500,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ padding: '10px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!showLogs.length ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
              표시할 로그가 없습니다.
            </div>
          ) : showLogs.map((log, idx) => {
            const from = STATUS_LABELS[log.from_status] || log.from_status || '-';
            const to = STATUS_LABELS[log.to_status] || log.to_status || '-';
            const reason = normalizeReason(log.reason);
            return (
              <div key={log.id || idx} style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${reason ? '#fecaca' : '#e2e8f0'}`, background: reason ? '#fef2f2' : '#f8fafc', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                  <span>{log.actor_name || log.actor || '시스템'}</span>
                  <span>{formatLogDateTime(log.created_at)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>
                  {from} {'->'} {to}
                </div>
                {reason ? <div style={{ fontSize: 11, color: '#b91c1c', lineHeight: 1.4 }}>{reason}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function EntryDetailEditor({
  pageState,
  pageActions,
  authAxios,
  onRefreshEntries,
  modal,
  subjects = [],
  orgs = [],
  asModal = false,
  submissionInfo = null,
}) {
  const {
    selectedEntry,
    detailDraft,
    entryLogsById,
    isVersionEditable,
    isAdmin,
    isReviewer,
    busySaveAll,
    busyAddDetail,
    busyDeleteDetailId,
    workflowReasons,
  } = pageState;
  const [entryBusy, setEntryBusy] = useState(false);
  const [workflowActionModal, setWorkflowActionModal] = useState(null);
  const [logModalOpen, setLogModalOpen] = useState(false);

  const subjectMap = useMemo(() => {
    const map = {};
    subjects.forEach((subject) => {
      map[Number(subject.id)] = subject;
    });
    return map;
  }, [subjects]);

  const details = useMemo(
    () => [...(selectedEntry?.details || [])].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)),
    [selectedEntry?.details]
  );

  const selectedEntryLogs = selectedEntry ? (entryLogsById[Number(selectedEntry.id)] || []) : [];
  const hasRejectLog = selectedEntryLogs.some(log => isRejectLog(log));
  const hasChangeLog = selectedEntryLogs.some(log => !isRejectLog(log));

  const subjectPath = useMemo(() => {
    if (!selectedEntry) return { jang: null, gwan: null, hang: null, mok: null };
    const node = subjectMap[Number(selectedEntry.subject)];
    if (!node) return { jang: null, gwan: null, hang: null, mok: null };

    const byLevel = {};
    let cur = node;
    let guard = 0;
    while (cur && guard < 6) {
      byLevel[cur.level] = cur;
      cur = cur.parent ? subjectMap[Number(cur.parent)] : null;
      guard += 1;
    }

    return {
      jang: byLevel[1] || null,
      gwan: byLevel[2] || null,
      hang: byLevel[3] || null,
      mok: byLevel[4] || node,
    };
  }, [selectedEntry, subjectMap]);

  const orgName = useMemo(() => {
    if (!selectedEntry) return '-';
    if (selectedEntry.organization_name) return selectedEntry.organization_name;
    return orgs.find(org => Number(org.id) === Number(selectedEntry.organization))?.name || '-';
  }, [selectedEntry, orgs]);

  const projectName = selectedEntry?.entrusted_project_name || orgName;
  const submittedBy = submissionInfo?.submittedBy || '-';
  const submittedAtLabel = submissionInfo?.submittedAtLabel || '-';
  const latestActor = submissionInfo?.latestActor || '-';
  const latestAtLabel = submissionInfo?.latestAtLabel || '-';
  const entryEditable = Boolean(isVersionEditable && selectedEntry && (selectedEntry.status || 'DRAFT') === 'DRAFT');
  const canApproveEntry = Boolean(isVersionEditable && selectedEntry && (
    ((selectedEntry.status === 'PENDING') && (isAdmin || isReviewer))
    || ((selectedEntry.status === 'REVIEWING') && isAdmin)
  ));
  const canRejectEntry = canApproveEntry;
  const canReopenEntry = Boolean(isVersionEditable && selectedEntry?.status === 'FINALIZED' && isAdmin);
  const canRecallEntry = Boolean(isVersionEditable && selectedEntry && isAdmin && ['PENDING', 'REVIEWING', 'FINALIZED'].includes(selectedEntry.status));

  const updateDraft = (detailId, patch) => {
    pageActions.setDetailDraft((prev) => ({
      ...prev,
      [detailId]: {
        ...(prev[detailId] || {}),
        ...patch,
      },
    }));
  };

  const draftValue = (detail, key) => {
    const patch = detailDraft[detail.id] || {};
    if (patch[key] !== undefined) return patch[key];
    return detail[key] ?? '';
  };

  const normalizePatch = (patch) => {
    const next = { ...patch };
    if (next.price !== undefined) next.price = Number(next.price || 0);
    if (next.qty !== undefined) next.qty = Number(next.qty || 0);
    if (next.freq !== undefined) next.freq = Number(next.freq || 0);
    return next;
  };

  const requireEditReason = async () => {
    const reason = normalizeReason(workflowReasons.detailEdit);
    if (!reason) {
      await modal.alert('수정 사유를 입력해주세요.');
      return '';
    }
    return reason;
  };

  const writeEditLog = async (reasonText) => {
    if (!selectedEntry) return;
    const reason = normalizeReason(reasonText);
    if (!reason) return;
    const payloadReason = `${REASON_TAGS.EDIT} ${reason}`;
    await authAxios.post(`/api/entries/${selectedEntry.id}/note/`, {
      reason: payloadReason,
    });
  };

  const saveAllDetailChanges = async () => {
    if (!selectedEntry || !entryEditable || busySaveAll) return;
    const reason = await requireEditReason();
    if (!reason) return;

    const detailIds = new Set(details.map(detail => Number(detail.id)));
    const targets = Object.entries(detailDraft).filter(([detailId, patch]) => (
      detailIds.has(Number(detailId)) && patch && Object.keys(patch).length
    ));
    if (!targets.length) {
      await modal.alert('저장할 변경사항이 없습니다.');
      return;
    }

    pageActions.setBusySaveAll(true);
    try {
      await Promise.all(targets.map(([detailId, patch]) => authAxios.patch(
        `/api/details/${detailId}/`,
        normalizePatch(patch)
      )));
      await writeEditLog(`상세 ${targets.length}건 수정: ${reason}`);
      await onRefreshEntries?.();
      pageActions.setDetailDraft((prev) => {
        const next = { ...prev };
        targets.forEach(([detailId]) => { delete next[detailId]; });
        return next;
      });
      pageActions.setWorkflowReason('detailEdit', '');
    } catch (error) {
      await modal.alert(apiErrorMessage(error, '상세 저장 중 오류가 발생했습니다.'));
    } finally {
      pageActions.setBusySaveAll(false);
    }
  };

  const addDetail = async () => {
    if (!selectedEntry || !entryEditable || busyAddDetail) return;
    const reason = await requireEditReason();
    if (!reason) return;

    pageActions.setBusyAddDetail(true);
    try {
      const nextOrder = details.reduce(
        (max, detail) => Math.max(max, Number(detail.sort_order || 0)),
        -1
      ) + 1;
      await authAxios.post('/api/details/', {
        entry: selectedEntry.id,
        name: '신규 산출내역',
        price: 0,
        qty: 1,
        freq: 1,
        sort_order: nextOrder,
        currency_unit: '원',
        unit: '식',
        freq_unit: '회',
        source: '자체',
        organization: selectedEntry.organization || null,
      });
      await writeEditLog(`상세 1건 추가: ${reason}`);
      await onRefreshEntries?.();
      pageActions.setWorkflowReason('detailEdit', '');
    } catch (error) {
      await modal.alert(apiErrorMessage(error, '상세 추가 중 오류가 발생했습니다.'));
    } finally {
      pageActions.setBusyAddDetail(false);
    }
  };

  const deleteDetail = async (detailId, detailName) => {
    if (!selectedEntry || !entryEditable || busyDeleteDetailId === detailId) return;
    const reason = await requireEditReason();
    if (!reason) return;
    const ok = await modal.confirm(`'${detailName || '산출내역'}'을(를) 삭제하시겠습니까?`);
    if (!ok) return;

    pageActions.setBusyDeleteDetailId(detailId);
    try {
      await authAxios.delete(`/api/details/${detailId}/`);
      await writeEditLog(`상세 삭제(${detailName || detailId}): ${reason}`);
      await onRefreshEntries?.();
      pageActions.setDetailDraft((prev) => {
        const next = { ...prev };
        delete next[detailId];
        return next;
      });
      pageActions.setWorkflowReason('detailEdit', '');
    } catch (error) {
      await modal.alert(apiErrorMessage(error, '상세 삭제 중 오류가 발생했습니다.'));
    } finally {
      pageActions.setBusyDeleteDetailId(null);
    }
  };

  const runEntryWorkflow = async (action, reason = '') => {
    if (!selectedEntry) return;
    setEntryBusy(true);
    try {
      if (action === 'approve' || action === 'reject' || action === 'reopen') {
        await authAxios.post('/api/entries/workflow/', {
          action,
          org_id: Number(selectedEntry.organization),
          year: selectedEntry.year,
          round: selectedEntry.supplemental_round || 0,
          entry_ids: [Number(selectedEntry.id)],
          ...(reason ? { reason } : {}),
          ...(action === 'reopen' ? { to_status: 'DRAFT' } : {}),
        });
      } else if (action === 'recall') {
        await authAxios.post(`/api/entries/${selectedEntry.id}/recall/`, {
          reason: reason || '검토 부서 회수',
        });
      }
      await onRefreshEntries?.();
      const reasonKeyByAction = {
        approve: 'entryApprove',
        reject: 'entryReject',
        reopen: 'entryReopen',
        recall: 'entryRecall',
      };
      const reasonKey = reasonKeyByAction[action];
      if (reasonKey) pageActions.setWorkflowReason(reasonKey, '');
    } catch (error) {
      await modal.alert(apiErrorMessage(error, '승인/반려 처리 중 오류가 발생했습니다.'));
    } finally {
      setEntryBusy(false);
    }
  };

  const workflowActionConfigs = {
    approve: {
      title: '승인 사유 입력',
      confirmLabel: '승인 실행',
      reasonKey: 'entryApprove',
      required: true,
    },
    reject: {
      title: '반려 사유 입력',
      confirmLabel: '반려 실행',
      reasonKey: 'entryReject',
      required: true,
    },
    reopen: {
      title: '재오픈 사유 입력',
      confirmLabel: '재오픈 실행',
      reasonKey: 'entryReopen',
      required: false,
    },
    recall: {
      title: '회수 사유 입력',
      confirmLabel: '회수 실행',
      reasonKey: 'entryRecall',
      required: false,
    },
  };

  if (!selectedEntry) {
    return (
      <section style={{ ...menuPanelCard, ...(asModal ? { boxShadow: 'none', border: '1px solid #e2e8f0' } : null) }}>
        <div style={menuPanelHead}>상세 검토</div>
        <div style={{ ...menuPanelBody, paddingTop: 10 }}>
          <EmptyState icon="?" title="대상 미선택" message="좌측 제출 목록에서 상세보기할 항목을 선택하세요." />
        </div>
      </section>
    );
  }

  const breadcrumbItems = [
    `장(사업명): ${projectName || '-'}`,
    `관: ${subjectPath.gwan?.name || '-'}`,
    `항: ${subjectPath.hang?.name || '-'}`,
    `목: ${subjectPath.mok?.name || selectedEntry.subject_name || '-'}`,
  ];

  const workflowConfig = workflowActionModal ? workflowActionConfigs[workflowActionModal] : null;
  const workflowReason = workflowConfig ? (workflowReasons[workflowConfig.reasonKey] || '') : '';

  return (
    <>
      {workflowActionModal && workflowConfig && (
        <WorkflowReasonModal
          title={workflowConfig.title}
          value={workflowReason}
          required={workflowConfig.required}
          confirmLabel={workflowConfig.confirmLabel}
          onChange={(value) => pageActions.setWorkflowReason(workflowConfig.reasonKey, value)}
          onConfirm={async () => {
            const reason = normalizeReason(workflowReason);
            setWorkflowActionModal(null);
            await runEntryWorkflow(workflowActionModal, reason);
          }}
          onCancel={() => setWorkflowActionModal(null)}
        />
      )}

      {logModalOpen && (
        <LogModal
          logs={selectedEntryLogs}
          subjectLabel={selectedEntry.subject_name || selectedEntry.subject_code || `#${selectedEntry.id}`}
          onClose={() => setLogModalOpen(false)}
        />
      )}

      <section style={{ ...menuPanelCard, ...(asModal ? { boxShadow: 'none', border: '1px solid #e2e8f0' } : null) }}>
        <div style={{ ...menuPanelHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>제출 상세 검토</span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <StatusBadge status={selectedEntry.status} />
            {(hasChangeLog || hasRejectLog) ? (
              <button
                type="button"
                style={actionBtn('#475569', '#f1f5f9', '#e2e8f0')}
                onClick={() => setLogModalOpen(true)}
              >
                <History size={11} /> 로그 보기
                {hasRejectLog ? <AlertCircle size={11} style={{ color: '#b91c1c' }} /> : null}
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ ...menuPanelBody, gap: 12 }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>제출자</span>
              <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{submittedBy}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>제출일시</span>
              <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{submittedAtLabel}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>최근 처리자</span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{latestActor}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>최근 처리일시</span>
              <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{latestAtLabel}</span>
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
              예산 분류 브레드크럼브
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {breadcrumbItems.map((item) => (
                <span key={item} style={{ fontSize: 12, color: '#334155', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 999, padding: '4px 9px' }}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
              수정 사유 <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              rows={2}
              placeholder="상세 추가/수정/삭제 시 사유를 입력하세요."
              value={workflowReasons.detailEdit || ''}
              onChange={(event) => pageActions.setWorkflowReason('detailEdit', event.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                style={actionBtn('#ffffff', '#16a34a', '#15803d', !entryEditable || busySaveAll)}
                disabled={!entryEditable || busySaveAll}
                onClick={saveAllDetailChanges}
              >
                <Save size={11} /> {busySaveAll ? '저장중...' : '수정 저장'}
              </button>
              <button
                type="button"
                style={actionBtn('#1d4ed8', '#eff6ff', '#bfdbfe', !entryEditable || busyAddDetail)}
                disabled={!entryEditable || busyAddDetail}
                onClick={addDetail}
              >
                <Plus size={11} /> {busyAddDetail ? '추가중...' : '내역 추가'}
              </button>
              {!entryEditable ? (
                <span style={{ fontSize: 11, color: '#92400e', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 6, padding: '3px 8px' }}>
                  현재 상태({STATUS_LABELS[selectedEntry.status] || selectedEntry.status})에서는 상세 수정이 제한됩니다.
                </span>
              ) : null}
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, minWidth: 180 }}>산출내역</th>
                  <th style={{ ...thStyle, minWidth: 80, textAlign: 'right' }}>단가</th>
                  <th style={{ ...thStyle, minWidth: 70, textAlign: 'right' }}>수량</th>
                  <th style={{ ...thStyle, minWidth: 70, textAlign: 'right' }}>횟수</th>
                  <th style={{ ...thStyle, minWidth: 110, textAlign: 'right' }}>합계</th>
                  <th style={{ ...thStyle, width: 40, textAlign: 'center' }} />
                </tr>
              </thead>
              <tbody>
                {!details.length ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', padding: 18 }}>
                      산출내역이 없습니다.
                    </td>
                  </tr>
                ) : details.map((detail) => {
                  const price = Number(draftValue(detail, 'price') || 0);
                  const qty = Number(draftValue(detail, 'qty') || 0);
                  const freq = Number(draftValue(detail, 'freq') || 0);
                  const rowAmount = price * qty * freq;
                  const dirty = Boolean(detailDraft[detail.id] && Object.keys(detailDraft[detail.id]).length);
                  return (
                    <tr key={detail.id} style={{ background: dirty ? '#fffbeb' : '#ffffff' }}>
                      <td style={tdStyle}>
                        <input
                          style={{ ...inputStyle, width: '100%', background: dirty ? '#fffbeb' : '#f8fafc' }}
                          value={draftValue(detail, 'name')}
                          disabled={!entryEditable}
                          onChange={(event) => updateDraft(detail.id, { name: event.target.value })}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <input
                          type="number"
                          style={{ ...inputStyle, width: 90, textAlign: 'right', background: dirty ? '#fffbeb' : '#f8fafc' }}
                          value={draftValue(detail, 'price')}
                          disabled={!entryEditable}
                          onChange={(event) => updateDraft(detail.id, { price: event.target.value })}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <input
                          type="number"
                          style={{ ...inputStyle, width: 70, textAlign: 'right', background: dirty ? '#fffbeb' : '#f8fafc' }}
                          value={draftValue(detail, 'qty')}
                          disabled={!entryEditable}
                          onChange={(event) => updateDraft(detail.id, { qty: event.target.value })}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <input
                          type="number"
                          style={{ ...inputStyle, width: 70, textAlign: 'right', background: dirty ? '#fffbeb' : '#f8fafc' }}
                          value={draftValue(detail, 'freq')}
                          disabled={!entryEditable}
                          onChange={(event) => updateDraft(detail.id, { freq: event.target.value })}
                        />
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800 }}>{num(rowAmount)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button
                          type="button"
                          title="삭제"
                          disabled={!entryEditable || busyDeleteDetailId === detail.id}
                          style={actionBtn('#b91c1c', '#fef2f2', '#fecaca', !entryEditable || busyDeleteDetailId === detail.id)}
                          onClick={() => deleteDetail(detail.id, detail.name)}
                        >
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {!!details.length && (
                <tfoot>
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan={4} style={{ ...tdStyle, fontWeight: 700, color: '#475569' }}>총 합계</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                      {num(selectedEntry.total_amount || 0)}
                    </td>
                    <td style={tdStyle} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 700, marginRight: 4 }}>개별 승인 처리</span>
            <button
              type="button"
              style={actionBtn('#ffffff', '#16a34a', '#15803d', !canApproveEntry || entryBusy)}
              disabled={!canApproveEntry || entryBusy}
              onClick={() => setWorkflowActionModal('approve')}
            >
              <Check size={11} /> 승인
            </button>
            <button
              type="button"
              style={actionBtn('#ffffff', '#dc2626', '#b91c1c', !canRejectEntry || entryBusy)}
              disabled={!canRejectEntry || entryBusy}
              onClick={() => setWorkflowActionModal('reject')}
            >
              <X size={11} /> 반려
            </button>
            <button
              type="button"
              style={actionBtn('#ffffff', '#d97706', '#b45309', !canReopenEntry || entryBusy)}
              disabled={!canReopenEntry || entryBusy}
              onClick={() => setWorkflowActionModal('reopen')}
            >
              <RotateCcw size={11} /> 재오픈
            </button>
            <button
              type="button"
              style={actionBtn('#ffffff', '#7c3aed', '#6d28d9', !canRecallEntry || entryBusy)}
              disabled={!canRecallEntry || entryBusy}
              onClick={() => setWorkflowActionModal('recall')}
            >
              <RotateCcw size={11} /> 회수
            </button>
            {entryBusy ? <span style={{ fontSize: 12, color: '#64748b' }}>처리 중...</span> : null}
          </div>
        </div>
      </section>
    </>
  );
}
