import { useState, useMemo } from 'react';
import { apiErrorMessage } from '../../traditionalLedger/shared';

export default function useProjectManagement(projects, authAxios, onRefresh, modalApi) {
    const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);
    const _confirm = (msg) => modalApi?.confirm ? modalApi.confirm(msg) : Promise.resolve(window.confirm(msg));
    const [projSearchText, setProjSearchText] = useState('');
    const [projYear, setProjYear] = useState(new Date().getFullYear());
    const [projForm, setProjForm] = useState({ name: '', organization: '', year: new Date().getFullYear() });
    const [projEditId, setProjEditId] = useState(null);
    const [projEditData, setProjEditData] = useState({});
    const [projCloneModal, setProjCloneModal] = useState(null);
    const [projSortConfig, setProjSortConfig] = useState(null);
    const [projBusy, setProjBusy] = useState(false);
    const [projSelectedIds, setProjSelectedIds] = useState([]);
    const [projDupDialog, setProjDupDialog] = useState(null);

    const filteredProjects = useMemo(() => {
        const q = projSearchText.trim().toLowerCase();
        let list = projects
            .filter(p => (!projYear || p.year === Number(projYear)) &&
                (!q || (p.name || '').toLowerCase().includes(q)));

        if (projSortConfig !== null) {
            list.sort((a, b) => {
                let aVal = a[projSortConfig.key];
                let bVal = b[projSortConfig.key];

                if (projSortConfig.key === 'total_budget' || projSortConfig.key === 'total_executed' || projSortConfig.key === 'total_balance') {
                    aVal = Number(aVal || 0);
                    bVal = Number(bVal || 0);
                } else if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = (bVal || '').toLowerCase();
                }

                if (aVal < bVal) return projSortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return projSortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            list.sort((a, b) => (b.year - a.year) || (a.name || '').localeCompare(b.name || ''));
        }
        return list;
    }, [projects, projSearchText, projYear, projSortConfig]);

    const projYears = useMemo(() => {
        const ys = [...new Set(projects.map(p => p.year))].sort((a, b) => b - a);
        return ys;
    }, [projects]);

    const createProject = async () => {
        if (!projForm.name.trim() || !projForm.organization) return _alert('사업명과 관리부서를 입력하세요.');
        const dup = projects.find(p =>
            p.organization === Number(projForm.organization) &&
            p.year === Number(projForm.year) &&
            (p.name || '').trim().toLowerCase() === projForm.name.trim().toLowerCase()
        );
        if (dup) {
            setProjDupDialog({ existing: dup, newForm: { ...projForm } });
            return;
        }
        try {
            await authAxios.post('/api/entrusted-projects/', {
                name: projForm.name.trim(),
                organization: Number(projForm.organization),
                year: Number(projForm.year)
            });
            setProjForm({ name: '', organization: '', year: new Date().getFullYear() });
            onRefresh();
        } catch (e) { _alert(apiErrorMessage(e, '사업 추가 실패')); }
    };

    const confirmCreateWithNewName = async (newName) => {
        if (!projDupDialog) return;
        try {
            await authAxios.post('/api/entrusted-projects/', {
                name: newName.trim(),
                organization: Number(projDupDialog.newForm.organization),
                year: Number(projDupDialog.newForm.year)
            });
            setProjForm({ name: '', organization: '', year: new Date().getFullYear() });
            setProjDupDialog(null);
            onRefresh();
        } catch (e) { _alert(apiErrorMessage(e, '사업 추가 실패')); }
    };

    const startProjEdit = (p) => {
        setProjEditId(p.id);
        setProjEditData({
            name: p.name || '',
            organization: p.organization ? String(p.organization) : '',
            year: p.year,
            status: p.status || 'ACTIVE'
        });
    };

    const saveProjEdit = async (id) => {
        try {
            await authAxios.patch(`/api/entrusted-projects/${id}/`, {
                name: projEditData.name,
                organization: Number(projEditData.organization),
                year: Number(projEditData.year),
                status: projEditData.status
            });
            setProjEditId(null);
            onRefresh();
        } catch (e) { _alert(apiErrorMessage(e, '사업 수정 실패')); }
    };

    // { id, name, entryCount } | { queue: [{id,name,entryCount},...], current: {id,name,entryCount} }
    const [forceDeleteProjDialog, setForceDeleteProjDialog] = useState(null);

    const deleteProj = async (id) => {
        if (!await _confirm('이 수탁사업을 삭제하시겠습니까?')) return;
        try {
            await authAxios.delete(`/api/entrusted-projects/${id}/`);
            setProjSelectedIds(prev => prev.filter(sId => sId !== id));
            onRefresh();
        } catch (e) {
            if (e.response?.status === 409 && e.response?.data?.can_force) {
                const proj = projects.find(p => p.id === id);
                setForceDeleteProjDialog({ id, name: proj?.name ?? String(id), entryCount: e.response.data.entry_count });
            } else {
                _alert(apiErrorMessage(e, '사업 삭제 실패'));
            }
        }
    };

    const bulkDeleteProjs = async () => {
        if (projSelectedIds.length === 0) return _alert('삭제할 사업을 선택하세요.');
        if (!await _confirm(`선택한 ${projSelectedIds.length}개의 수탁사업을 삭제하시겠습니까?`)) return;
        setProjBusy(true);
        const failed = [];
        const forceQueue = []; // 여러 건 모두 수집
        try {
            for (const id of projSelectedIds) {
                try {
                    await authAxios.delete(`/api/entrusted-projects/${id}/`);
                } catch (e) {
                    if (e.response?.status === 409 && e.response?.data?.can_force) {
                        const proj = projects.find(p => p.id === id);
                        forceQueue.push({ id, name: proj?.name ?? String(id), entryCount: e.response.data.entry_count });
                    } else {
                        failed.push(id);
                    }
                }
            }
            setProjSelectedIds([]);
            onRefresh();
            if (forceQueue.length > 0) {
                // 첫 번째를 current로, 나머지를 queue에 적재
                const [first, ...rest] = forceQueue;
                setForceDeleteProjDialog({ ...first, queue: rest });
            }
            if (failed.length > 0) _alert(`${failed.length}건 삭제 실패 (권한 오류)`);
        } finally { setProjBusy(false); }
    };

    const confirmForceDeleteProj = async () => {
        if (!forceDeleteProjDialog) return;
        const { id, queue = [] } = forceDeleteProjDialog;
        try {
            await authAxios.delete(`/api/entrusted-projects/${id}/force-delete/`);
            setProjSelectedIds(prev => prev.filter(sid => sid !== id));
            onRefresh();
            // 남은 큐가 있으면 다음 항목으로 이어서 표시
            if (queue.length > 0) {
                const [next, ...rest] = queue;
                setForceDeleteProjDialog({ ...next, queue: rest });
            } else {
                setForceDeleteProjDialog(null);
            }
        } catch (e) { _alert(apiErrorMessage(e, '사업 강제 삭제 실패')); }
    };

    const cloneProject = async ({ sources, year, organization, copyEntries }) => {
        if (!sources || sources.length === 0) return;
        setProjBusy(true);
        try {
            let successCount = 0;
            const failedNames = [];
            for (const source of sources) {
                try {
                    await authAxios.post(`/api/entrusted-projects/${source.id}/clone/`, {
                        year: Number(year),
                        name: source.name,
                        organization: organization || source.organization,
                        copy_entries: copyEntries
                    });
                    successCount++;
                } catch (e) {
                    failedNames.push(source.name);
                }
            }
            onRefresh();
            setProjCloneModal(null);
            setProjSelectedIds([]);
            const msg = successCount > 0
                ? `총 ${successCount}건의 사업이 ${year}년도로 복사되었습니다.`
                : '';
            const failMsg = failedNames.length > 0
                ? `\n복사 실패(${failedNames.length}건): ${failedNames.join(', ')}`
                : '';
            _alert((msg + failMsg).trim());
        } catch (e) { _alert(apiErrorMessage(e, '예산 차용 실패')); }
        finally { setProjBusy(false); }
    };

    return {
        projSearchText, setProjSearchText,
        projYear, setProjYear,
        projForm, setProjForm,
        projEditId, setProjEditId,
        projEditData, setProjEditData,
        projCloneModal, setProjCloneModal,
        projBusy, setProjBusy,
        projSelectedIds, setProjSelectedIds,
        filteredProjects, projYears, createProject, startProjEdit, saveProjEdit, deleteProj, bulkDeleteProjs, cloneProject,
        projSortConfig, setProjSortConfig,
        projDupDialog, setProjDupDialog, confirmCreateWithNewName,
        forceDeleteProjDialog, setForceDeleteProjDialog, confirmForceDeleteProj,
    };
}
