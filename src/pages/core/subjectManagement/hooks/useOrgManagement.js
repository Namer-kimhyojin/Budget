import { useState, useMemo, useCallback } from 'react';
import { apiErrorMessage, generateOrgCode } from '../../traditionalLedger/shared';

export default function useOrgManagement(orgs, setLocalOrgs, authAxios, modalApi) {
    const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);
    const _confirm = (msg) => modalApi?.confirm ? modalApi.confirm(msg) : Promise.resolve(window.confirm(msg));
    const [orgSearchText, setOrgSearchText] = useState('');
    const [orgExpanded, setOrgExpanded] = useState({});
    const [orgAddModal, setOrgAddModal] = useState(null);
    const [orgEditId, setOrgEditId] = useState(null);
    const [orgEditData, setOrgEditData] = useState({});
    const [orgBusyId, setOrgBusyId] = useState(null);

    const orgById = useMemo(() => {
        const m = new Map();
        orgs.forEach(o => m.set(Number(o.id), o));
        return m;
    }, [orgs]);

    const orgTree = useMemo(() => {
        const q = orgSearchText.trim().toLowerCase();
        const build = (parentId = null) => orgs
            .filter(o => o.parent === parentId)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id)
            .map(o => ({ ...o, children: build(o.id) }));
        const full = build(null);
        if (!q) return full;
        const filterTree = (nodes) => nodes.reduce((acc, n) => {
            const match = (n.name || '').toLowerCase().includes(q) || (n.code || '').toLowerCase().includes(q);
            const filteredChildren = filterTree(n.children);
            if (match || filteredChildren.length > 0) acc.push({ ...n, children: filteredChildren });
            return acc;
        }, []);
        return filterTree(full);
    }, [orgs, orgSearchText]);

    const orgVisibleNodes = useMemo(() => {
        const out = [];
        const walk = (nodes, depth = 0, isLastArr = []) => {
            nodes.forEach((n, idx) => {
                const isLast = idx === nodes.length - 1;
                out.push({ ...n, depth, isLastChild: isLast, lineData: isLastArr });
                if (orgExpanded[n.id] && n.children.length > 0) walk(n.children, depth + 1, [...isLastArr, isLast]);
            });
        };
        walk(orgTree);
        return out;
    }, [orgTree, orgExpanded]);
    const orgAllIds = useMemo(() => {
        const ids = {};
        orgs.forEach(o => { ids[o.id] = true; });
        return ids;
    }, [orgs]);

    const orgToggle = useCallback((id) => setOrgExpanded(p => ({ ...p, [id]: !p[id] })), []);

    const confirmAddOrg = useCallback(async ({ name, org_type }, parent) => {
        const code = generateOrgCode();
        try {
            const res = await authAxios.post('/api/orgs/', { name, code, org_type: org_type || (parent ? 'team' : 'dept'), parent: parent?.id || null });
            const newSortOrder = orgs.filter(o => (o.parent ?? null) === (parent?.id ?? null)).length;
            setLocalOrgs(prev => [...prev, { ...res.data, sort_order: newSortOrder }]);
            if (parent) setOrgExpanded(p => ({ ...p, [parent.id]: true }));
        } catch (e) { _alert(apiErrorMessage(e, '조직 추가 실패')); }
        setOrgAddModal(null);
    }, [authAxios, orgs, setLocalOrgs]);

    const startOrgEdit = (org) => { setOrgEditId(org.id); setOrgEditData({ name: org.name || '' }); };
    const cancelOrgEdit = () => { setOrgEditId(null); setOrgEditData({}); };
    const saveOrgEdit = async (id) => {
        const newName = orgEditData.name?.trim();
        if (!newName) return _alert('명칭을 입력하세요.');
        try {
            await authAxios.patch(`/api/orgs/${id}/`, { name: newName });
            setLocalOrgs(prev => prev.map(o => o.id === id ? { ...o, name: newName } : o));
            cancelOrgEdit();
        } catch (e) { _alert(apiErrorMessage(e, '조직 수정 실패')); }
    };

    const deleteOrg = async (id) => {
        if (!await _confirm('이 조직과 하위 조직이 모두 삭제됩니다. 계속하시겠습니까?')) return;
        try {
            await authAxios.delete(`/api/orgs/${id}/`);
            const toRemove = new Set();
            const collect = (targetId) => {
                toRemove.add(targetId);
                orgs.filter(o => o.parent === targetId).forEach(o => collect(o.id));
            };
            collect(id);
            setLocalOrgs(prev => prev.filter(o => !toRemove.has(o.id)));
        } catch (e) { _alert(apiErrorMessage(e, '조직 삭제 실패 (사용 중일 수 있습니다)')); }
    };

    const onOrgDragEnd = useCallback(async (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index) return;
        const srcNode = orgVisibleNodes[source.index];
        const prevNode = destination.index > 0 ? orgVisibleNodes[destination.index - 1] : null;
        if (!srcNode) return;

        let newParent = null;
        if (destination.index > 0 && prevNode) {
            newParent = (orgExpanded[prevNode.id] && prevNode.children?.length > 0)
                ? prevNode
                : (prevNode.parent ? orgById.get(Number(prevNode.parent)) : null);
        }

        const srcParentId = srcNode.parent ?? null;
        const destParentId = newParent ? newParent.id : null;
        const sameParent = srcParentId === destParentId;

        try {
            setOrgBusyId(srcNode.id);
            if (sameParent) {
                const siblings = orgVisibleNodes.filter(n => (n.parent ?? null) === srcParentId && n.depth === srcNode.depth);
                const fromIdx = siblings.findIndex(n => n.id === srcNode.id);
                const dstSiblingNode = orgVisibleNodes[destination.index];
                const toIdx = dstSiblingNode ? siblings.findIndex(n => n.id === dstSiblingNode.id) : siblings.length - 1;
                const finalTo = toIdx < 0 ? siblings.length - 1 : toIdx;

                const reordered = [...siblings];
                const [moved] = reordered.splice(fromIdx < 0 ? 0 : fromIdx, 1);
                reordered.splice(finalTo, 0, moved);
                const orderedIds = reordered.map(n => n.id);

                // 낙관적 업데이트 후 실패 시 롤백할 스냅샷 보관
                let snapshot;
                setLocalOrgs(prev => {
                    snapshot = prev;
                    const updated = [...prev];
                    orderedIds.forEach((id, idx) => {
                        const i = updated.findIndex(s => s.id === id);
                        if (i >= 0) updated[i] = { ...updated[i], sort_order: idx };
                    });
                    return updated;
                });
                authAxios.post('/api/orgs/reorder/', { ordered_ids: orderedIds }).catch(() => {
                    if (snapshot) setLocalOrgs(snapshot);
                });
            } else {
                // 부모 변경은 API 성공 후에만 UI 반영
                await authAxios.patch(`/api/orgs/${srcNode.id}/`, { parent: destParentId });
                setLocalOrgs(prev => prev.map(o => o.id === srcNode.id ? { ...o, parent: destParentId } : o));
                if (newParent) setOrgExpanded(p => ({ ...p, [newParent.id]: true }));
            }
        } catch (e) {
            _alert(apiErrorMessage(e, '이동 실패'));
        }
        finally { setOrgBusyId(null); }
    }, [orgVisibleNodes, orgExpanded, orgById, setLocalOrgs, authAxios]);

    return {
        orgSearchText, setOrgSearchText,
        orgExpanded, setOrgExpanded,
        orgAddModal, setOrgAddModal,
        orgEditId, setOrgEditId,
        orgEditData, setOrgEditData,
        orgBusyId, setOrgBusyId,
        orgTree, orgVisibleNodes, orgToggle, orgAllIds,
        confirmAddOrg, startOrgEdit, cancelOrgEdit, saveOrgEdit, deleteOrg, onOrgDragEnd
    };
}
