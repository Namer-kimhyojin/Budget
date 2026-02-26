import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { menuStyles } from '../../shared/menuUi';
import { apiErrorMessage, num } from '../../shared/utils';
import { STATUS_LABELS, isRejectLog } from './helpers';

const { menuPanelCard, menuPanelHead, menuPanelBody } = menuStyles;

const actionBtn = (color, bg, border, disabled) => ({
  border: `1px solid ${disabled ? '#e2e8f0' : border}`,
  borderRadius: 8,
  padding: '7px 14px',
  fontSize: 12,
  fontWeight: 700,
  cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? '#f8fafc' : bg,
  color: disabled ? '#cbd5e1' : color,
  whiteSpace: 'nowrap',
});

function ReasonModal({
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
    if (required && !String(value || '').trim()) {
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
          <label style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#64748b', fontWeight: 700 }}>
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
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${error ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
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

export default function WorkflowPanel({
  pageState,
  pageActions,
  version,
  selectedDeptId,
  selectedTeamId,
  authAxios,
  modal,
  onRefreshEntries,
}) {
  const {
    isAdmin,
    isManager,
    isRequestor,
    isVersionEditable,
    busyWorkflow,
    deptStatus,
    scopeEntries,
    entryLogsById,
    subjectById,
    workflowReasons,
  } = pageState;
  const [reasonModalAction, setReasonModalAction] = useState(null);

  const progressCounts = useMemo(() => {
    const pending = scopeEntries.filter(entry => (entry.status || 'DRAFT') === 'PENDING').length;
    const forwarded = scopeEntries.filter(entry => ['REVIEWING', 'FINALIZED'].includes(entry.status || 'DRAFT')).length;
    const rejected = scopeEntries.filter((entry) => {
      const logs = entryLogsById[Number(entry.id)] || [];
      return logs.some(log => isRejectLog(log));
    }).length;
    return { pending, forwarded, rejected };
  }, [scopeEntries, entryLogsById]);

  // 매니저 확인 메뉴: STAFF(팀원)가 제출, MANAGER가 검토·제출(총무팀으로)
  const canSubmitDept = isVersionEditable && deptStatus === 'DRAFT' && (isAdmin || isRequestor);
  const canApproveDept = isVersionEditable && deptStatus === 'PENDING' && (isAdmin || isManager);
  const canRejectDept = isVersionEditable && deptStatus === 'PENDING' && (isAdmin || isManager);
  const canReopenDept = isVersionEditable && deptStatus !== 'DRAFT' && isAdmin;

  const nextApproveLabel = '총무팀으로 제출';

  const reasonFieldByAction = {
    approve: 'deptApprove',
    reject: 'deptReject',
    reopen: 'deptReopen',
  };

  const runDeptWorkflow = async (action, reason = '') => {
    if (!version || !selectedDeptId) {
      await modal.alert('예산 회차와 부서를 선택해주세요.');
      return;
    }
    if (!scopeEntries.length) {
      await modal.alert('처리할 예산 항목이 없습니다.');
      return;
    }

    const fromStatusMap = {
      submit: 'DRAFT',
      approve: deptStatus,
      reject: deptStatus,
      reopen: 'FINALIZED',
    };
    const toStatusMap = {
      submit: 'PENDING',
      approve: deptStatus === 'REVIEWING' ? 'FINALIZED' : 'REVIEWING',
      reject: 'DRAFT',
      reopen: 'DRAFT',
    };

    const fromStatus = fromStatusMap[action];
    const toStatus = toStatusMap[action];
    const eligible = scopeEntries.filter(entry => (entry.status || 'DRAFT') === fromStatus);
    if (!eligible.length) {
      await modal.alert(`'${STATUS_LABELS[fromStatus] || fromStatus}' 상태 항목이 없습니다.`);
      return;
    }

    if (action === 'submit') {
      let income = 0;
      let expense = 0;
      scopeEntries.forEach((entry) => {
        const amount = Number(entry.total_amount || 0);
        const subjectType = entry.subject_type || subjectById[Number(entry.subject)]?.subject_type;
        if (subjectType === 'income') income += amount;
        else expense += amount;
      });
      if (income !== expense) {
        await modal.alert(
          `수입/지출 합계가 일치하지 않아 제출할 수 없습니다.\n수입: ${num(income)} / 지출: ${num(expense)} / 차액: ${num(income - expense)}`
        );
        return;
      }
    }

    const actionLabel = {
      submit: '제출',
      approve: nextApproveLabel,
      reject: '반려',
      reopen: '재오픈',
    }[action];

    const ok = await modal.confirm(
      `${eligible.length}건을 ${actionLabel} 처리하시겠습니까?\n(${STATUS_LABELS[fromStatus] || fromStatus} → ${STATUS_LABELS[toStatus] || toStatus})`
    );
    if (!ok) return;

    pageActions.setBusyWorkflow(true);
    try {
      const payload = {
        action,
        org_id: Number(selectedTeamId || selectedDeptId),
        year: version.year,
        round: version.round,
        entry_ids: eligible.map(entry => Number(entry.id)),
      };
      if (reason) payload.reason = reason;
      if (action === 'reopen') payload.to_status = 'DRAFT';
      const res = await authAxios.post('/api/entries/workflow/', payload);
      await onRefreshEntries?.();
      await modal.alert(res?.data?.message || `${actionLabel} 처리가 완료되었습니다.`);
      if (reasonFieldByAction[action]) {
        pageActions.setWorkflowReason(reasonFieldByAction[action], '');
      }
    } catch (error) {
      await modal.alert(apiErrorMessage(error, '워크플로우 처리 중 오류가 발생했습니다.'));
    } finally {
      pageActions.setBusyWorkflow(false);
    }
  };

  const openReasonModal = (action) => {
    if (action === 'approve' && !canApproveDept) return;
    if (action === 'reject' && !canRejectDept) return;
    if (action === 'reopen' && !canReopenDept) return;
    setReasonModalAction(action);
  };

  const reasonFieldKey = reasonModalAction ? reasonFieldByAction[reasonModalAction] : '';
  const reasonValue = reasonFieldKey ? (workflowReasons[reasonFieldKey] || '') : '';
  const reasonModalConfig = {
    approve: { title: '총무팀 제출 사유 입력', confirmLabel: '총무팀으로 제출', required: false },
    reject: { title: '반려 사유 입력', confirmLabel: '반려 실행', required: true },
    reopen: { title: '재오픈 사유 입력', confirmLabel: '재오픈 실행', required: false },
  }[reasonModalAction];

  return (
    <>
      {reasonModalAction && reasonModalConfig && (
        <ReasonModal
          title={reasonModalConfig.title}
          value={reasonValue}
          required={reasonModalConfig.required}
          confirmLabel={reasonModalConfig.confirmLabel}
          onChange={(value) => pageActions.setWorkflowReason(reasonFieldKey, value)}
          onConfirm={async () => {
            setReasonModalAction(null);
            await runDeptWorkflow(reasonModalAction, reasonValue.trim());
          }}
          onCancel={() => setReasonModalAction(null)}
        />
      )}

      <section style={menuPanelCard}>
        <div style={{ ...menuPanelHead, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span>부서 워크플로우</span>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            현재 상태: <strong style={{ color: '#0f172a' }}>{STATUS_LABELS[deptStatus] || deptStatus}</strong>
          </span>
        </div>

        <div style={{ ...menuPanelBody, gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 999, padding: '3px 10px', fontWeight: 700 }}>
              매니저 검토중 {progressCounts.pending}건
            </span>
            <span style={{ fontSize: 11, color: '#166534', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '3px 10px', fontWeight: 700 }}>
              총무팀 제출 {progressCounts.forwarded}건
            </span>
            <span style={{ fontSize: 11, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 999, padding: '3px 10px', fontWeight: 700 }}>
              반려 {progressCounts.rejected}건
            </span>
            <span style={{ fontSize: 11, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 999, padding: '3px 10px', fontWeight: 600 }}>
              전체 {scopeEntries.length}건
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              style={actionBtn('#1d4ed8', '#eff6ff', '#bfdbfe', !canSubmitDept || busyWorkflow)}
              disabled={!canSubmitDept || busyWorkflow}
              onClick={() => runDeptWorkflow('submit')}
            >
              제출
            </button>
            <button
              type="button"
              style={actionBtn('#15803d', '#f0fdf4', '#bbf7d0', !canApproveDept || busyWorkflow)}
              disabled={!canApproveDept || busyWorkflow}
              onClick={() => openReasonModal('approve')}
            >
              {nextApproveLabel}
            </button>
            <button
              type="button"
              style={actionBtn('#b91c1c', '#fef2f2', '#fecaca', !canRejectDept || busyWorkflow)}
              disabled={!canRejectDept || busyWorkflow}
              onClick={() => openReasonModal('reject')}
            >
              반려
            </button>
            <button
              type="button"
              style={actionBtn('#92400e', '#fffbeb', '#fcd34d', !canReopenDept || busyWorkflow)}
              disabled={!canReopenDept || busyWorkflow}
              onClick={() => openReasonModal('reopen')}
            >
              재오픈
            </button>
            {busyWorkflow ? <span style={{ fontSize: 12, color: '#64748b' }}>처리 중...</span> : null}
          </div>

          {!isVersionEditable && (
            <div style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #fde68a', background: '#fffbeb', color: '#92400e', fontSize: 12, fontWeight: 600 }}>
              현재 회차는 잠금 상태입니다. 접수중(PENDING) 회차에서만 워크플로우 처리할 수 있습니다.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
