import { useState } from 'react';
import { num, apiErrorMessage } from '../shared';

export function useWorkflow({
    isVersionEditable,
    versionLockMessage,
    selectedScopeOrgId,
    version,
    orgs,
    deptStatus,
    deptEntries,
    localDetails,
    subjects,
    authAxios,
    onRefresh,
    modalApi,
    pushToast
}) {
    const [wfModal, setWfModal] = useState(null);

    const openWorkflowModal = (action) => {
        if (!isVersionEditable) {
            pushToast(versionLockMessage, 'error');
            return;
        }
        if (!selectedScopeOrgId || !version) return;
        const orgName = orgs.find(o => Number(o.id) === Number(selectedScopeOrgId))?.name || '';
        const actionLabels = { submit: '조직송부 (제출)', approve: deptStatus === 'REVIEWING' ? '예산확정' : '검토승인', reject: '반려', reopen: '확정해지' };
        const actionDescriptions = {
            submit: '작성중인 모든 예산 항목을 제출 상태로 변경합니다. 제출 후에는 산출내역 수정이 불가합니다.',
            approve: deptStatus === 'REVIEWING' ? '검토 완료된 예산을 최종 확정합니다. 확정 후에는 관리자만 해지할 수 있습니다.' : '제출된 예산을 검토 단계로 이동합니다.',
            reject: '해당 조직의 예산을 반려하여 작성중 상태로 되돌립니다. 담당자가 수정 후 재제출할 수 있습니다.',
            reopen: '확정된 예산을 해지하여 작성중 상태로 되돌립니다.'
        };
        const targetStatus = { submit: 'PENDING', approve: deptStatus === 'REVIEWING' ? 'FINALIZED' : 'REVIEWING', reject: 'DRAFT', reopen: 'DRAFT' };
        const requiredFromStatus = { submit: 'DRAFT', approve: deptStatus, reject: deptStatus, reopen: 'FINALIZED' };

        // 대상 엔트리 분석
        const eligible = deptEntries.filter(e => (e.status || 'DRAFT') === requiredFromStatus[action]);
        const ineligible = deptEntries.filter(e => (e.status || 'DRAFT') !== requiredFromStatus[action]);

        // 송부 시 검증
        const warnings = [];
        let submitBlocked = false;
        if (action === 'submit') {
            const noDetails = eligible.filter(e => !e.details?.length);
            const zeroAmt = eligible.filter(e => {
                if (!e.details?.length) return false;
                const total = e.details.reduce((sum, d) => {
                    const p = Number(localDetails[d.id]?.price ?? d.price ?? 0);
                    const q = Number(localDetails[d.id]?.qty ?? d.qty ?? 0);
                    const f = Number(localDetails[d.id]?.freq ?? d.freq ?? 0);
                    return sum + (p * q * f);
                }, 0);
                return total === 0;
            });
            if (noDetails.length) warnings.push({ type: 'warn', msg: `산출내역이 없는 항목 ${noDetails.length}건이 있습니다.` });
            if (zeroAmt.length) warnings.push({ type: 'warn', msg: `예산액이 0원인 항목 ${zeroAmt.length}건이 있습니다.` });

            // [New] Balance Check
            const scopeInc = deptEntries.filter(e => subjects.find(s => Number(s.id) === Number(e.subject))?.subject_type === 'income')
                .reduce((sum, e) => sum + (e.details?.reduce((dSum, d) => {
                    const p = Number(localDetails[d.id]?.price ?? d.price ?? 0);
                    const q = Number(localDetails[d.id]?.qty ?? d.qty ?? 0);
                    const f = Number(localDetails[d.id]?.freq ?? d.freq ?? 0);
                    return dSum + (p * q * f);
                }, 0) || Number(e.total_amount || 0)), 0);

            const scopeExp = deptEntries.filter(e => subjects.find(s => Number(s.id) === Number(e.subject))?.subject_type === 'expense')
                .reduce((sum, e) => sum + (e.details?.reduce((dSum, d) => {
                    const p = Number(localDetails[d.id]?.price ?? d.price ?? 0);
                    const q = Number(localDetails[d.id]?.qty ?? d.qty ?? 0);
                    const f = Number(localDetails[d.id]?.freq ?? d.freq ?? 0);
                    return dSum + (p * q * f);
                }, 0) || Number(e.total_amount || 0)), 0);

            if (scopeInc !== scopeExp) {
                submitBlocked = true;
                warnings.push({
                    type: 'error',
                    msg: `수입과 지출의 합계가 일치하지 않습니다. (차액: ${num(scopeInc - scopeExp)}원)\n수입: ${num(scopeInc)}원 / 지출: ${num(scopeExp)}원\n\n반드시 수지균형을 맞춘 후 제출할 수 있습니다.`
                });
            }
        }

        // 항목별 상세 정보
        const entrySummaries = eligible.map(e => {
            const mok = subjects.find(s => Number(s.id) === Number(e.subject));
            const hang = mok ? subjects.find(s => Number(s.id) === Number(mok.parent)) : null;
            const amt = e.details?.reduce((sum, d) => {
                const p = Number(localDetails[d.id]?.price ?? d.price ?? 0);
                const q = Number(localDetails[d.id]?.qty ?? d.qty ?? 0);
                const f = Number(localDetails[d.id]?.freq ?? d.freq ?? 0);
                return sum + (p * q * f);
            }, 0) || Number(e.total_amount || 0);
            return { id: e.id, mokName: mok?.name || '미지정', hangName: hang?.name || '', amount: amt, detailCount: e.details?.length || 0, status: e.status || 'DRAFT' };
        });

        setWfModal({
            action, orgName, actionLabel: actionLabels[action], description: actionDescriptions[action],
            targetStatus: targetStatus[action], eligible, ineligible, entrySummaries, warnings, reason: '', submitBlocked
        });
    };

    const executeWorkflow = async () => {
        if (!wfModal) return;
        if (!isVersionEditable) {
            pushToast(versionLockMessage, 'error');
            setWfModal(null);
            return;
        }
        const { action, eligible, reason } = wfModal;
        if (!eligible.length) { setWfModal(null); return; }
        if (action === 'submit' && wfModal.submitBlocked) {
            alert('수입/지출 합계가 맞지 않아 제출할 수 없습니다.');
            return;
        }
        if (action === 'reject' && !reason?.trim()) {
            alert('반려 사유를 입력해 주세요.');
            return;
        }
        try {
            const payload = { action, org_id: selectedScopeOrgId, year: version.year, round: version.round };
            if (action === 'reject') payload.reason = reason;
            if (action === 'reopen') payload.to_status = 'DRAFT';
            const res = await authAxios.post(`/api/entries/workflow/`, payload);
            const updatedCount = res.data?.updated_count || eligible.length;
            setWfModal(null);
            onRefresh();
            modalApi.alert(`${wfModal.actionLabel} 처리 완료\n${updatedCount}건의 예산 항목이 처리되었습니다.`);
        } catch (e) {
            alert(apiErrorMessage(e, '워크플로우 처리 중 오류가 발생했습니다.'));
        }
    };

    return {
        wfModal,
        setWfModal,
        openWorkflowModal,
        executeWorkflow,
        closeWorkflowModal: () => setWfModal(null)
    };
}
