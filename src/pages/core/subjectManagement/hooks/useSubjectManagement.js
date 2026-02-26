import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { apiErrorMessage, copyTextToClipboard, generateInternalCode } from '../../traditionalLedger/shared';

export default function useSubjectManagement(subjects, setLocalSubjects, authAxios, onRefresh, typeTab, entries = [], modalApi) {
    const _alert = (msg) => (modalApi?.alert ?? window.alert)(msg);
    const _confirm = (msg) => modalApi?.confirm ? modalApi.confirm(msg) : Promise.resolve(window.confirm(msg));
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '' });
    const [expanded, setExpanded] = useState({});
    const [searchText, setSearchText] = useState('');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [sheetText, setSheetText] = useState('');
    const [sheetBusy, setSheetBusy] = useState(false);
    const [addModal, setAddModal] = useState(null);
    const [subjectBusyId, setSubjectBusyId] = useState(null);
    const [copiedSubjectName, setCopiedSubjectName] = useState('');
    const [clipboardMode, setClipboardMode] = useState(null);
    const [hasClipboard, setHasClipboard] = useState(false);
    const subjectClipboardRef = useRef(null);

    const subjectById = useMemo(() => {
        const m = new Map();
        subjects.forEach(s => m.set(Number(s.id), s));
        return m;
    }, [subjects]);

    const tree = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        const typeSubjects = subjects.filter(s => s.subject_type === typeTab);
        const build = (parentId = null) => typeSubjects
            .filter(s => s.parent === parentId)
            .map(s => ({ ...s, children: build(s.id) }));
        const full = build(null);
        if (!q) return full;
        const filterTree = (nodes) => nodes.reduce((acc, n) => {
            const match = (n.name || '').toLowerCase().includes(q) || (n.code || '').toLowerCase().includes(q);
            const filteredChildren = filterTree(n.children);
            if (match || filteredChildren.length > 0) acc.push({ ...n, children: filteredChildren });
            return acc;
        }, []);
        return filterTree(full);
    }, [subjects, typeTab, searchText]);

    const visibleNodes = useMemo(() => {
        const out = [];
        const walk = (nodes, depth = 0) => {
            nodes.forEach((n, idx) => {
                const isLast = idx === nodes.length - 1;
                out.push({ ...n, depth, isLastChild: isLast });
                if (expanded[n.id] && n.children.length > 0) walk(n.children, depth + 1);
            });
        };
        walk(tree);
        return out;
    }, [tree, expanded]);

    const allIds = useMemo(() => {
        const ids = {};
        subjects.filter(s => s.subject_type === typeTab).forEach(s => { ids[s.id] = true; });
        return ids;
    }, [subjects, typeTab]);

    const expandAll = useCallback(() => setExpanded(allIds), [allIds]);
    const collapseAll = useCallback(() => setExpanded({}), []);

    // level 1~4까지 단계별 펼치기: 해당 level 미만의 노드만 expanded에 포함
    const expandToLevel = useCallback((maxLevel) => {
        const ids = {};
        subjects.filter(s => s.subject_type === typeTab && Number(s.level) < maxLevel)
            .forEach(s => { ids[s.id] = true; });
        setExpanded(ids);
    }, [subjects, typeTab]);

    useEffect(() => { if (searchText.trim()) expandAll(); }, [searchText, expandAll]);

    const collectSubtreeNodes = useCallback((rootId) => {
        const res = [];
        const walk = (id) => {
            const s = subjectById.get(Number(id));
            if (!s) return;
            res.push(s);
            subjects.filter(item => Number(item.parent) === Number(id)).forEach(child => walk(child.id));
        };
        walk(rootId);
        return res;
    }, [subjects, subjectById]);

    const countDescendants = useCallback((s) => {
        let count = 0;
        const walk = (id) => {
            subjects.filter(item => Number(item.parent) === Number(id)).forEach(child => {
                count++;
                walk(child.id);
            });
        };
        walk(s.id);
        return count;
    }, [subjects]);

    const toggle = useCallback((id) => setExpanded(p => ({ ...p, [id]: !p[id] })), []);

    const startEdit = (s) => { setEditingId(s.id); setEditData({ name: s.name, description: s.description || '' }); };
    const cancelEdit = () => { setEditingId(null); setEditData({ name: '', description: '' }); };
    const saveEdit = async (id) => {
        if (!editData.name.trim()) return _alert('명칭을 입력하세요.');
        try {
            await authAxios.patch(`/api/subjects/${id}/`, { name: editData.name.trim(), description: editData.description.trim() });
            setLocalSubjects(prev => prev.map(s => s.id === id ? { ...s, name: editData.name.trim(), description: editData.description.trim() } : s));
            cancelEdit();
        } catch (e) { _alert(apiErrorMessage(e, '계정 수정 실패')); }
    };

    const deleteSubject = async (id) => {
        if (subjectBusyId === id) return;
        if (!await _confirm('이 항목과 모든 하위 항목이 삭제됩니다. 계속하시겠습니까?')) return;
        const toRemove = new Set();
        const collect = (tid) => {
            toRemove.add(Number(tid));
            subjects.filter(s => Number(s.parent) === Number(tid)).forEach(child => collect(child.id));
        };
        collect(id);
        const hasLinkedEntries = entries.some(entry => toRemove.has(Number(entry.subject)));
        if (hasLinkedEntries) {
            _alert('현재 회차의 예산 항목에서 사용 중인 계정이 포함되어 삭제할 수 없습니다.');
            return;
        }
        try {
            setSubjectBusyId(id);
            await authAxios.delete(`/api/subjects/${id}/`);
            setLocalSubjects(prev => prev.filter(s => !toRemove.has(Number(s.id))));
        } catch (e) { _alert(apiErrorMessage(e, '계정 삭제 실패 (사용 중인 계정일 수 있습니다)')); }
        finally { setSubjectBusyId(null); }
    };

    const confirmAddSubject = async ({ name }, parent) => {
        const code = generateInternalCode();
        const nextLevel = parent ? parent.level + 1 : 1;
        try {
            const res = await authAxios.post('/api/subjects/', { code, name, parent: parent?.id || null, level: nextLevel, subject_type: typeTab });
            setLocalSubjects(prev => [...prev, res.data]);
            if (parent) setExpanded(p => ({ ...p, [parent.id]: true }));
        } catch (e) { _alert(apiErrorMessage(e, '계정 추가 실패')); }
        setAddModal(null);
    };

    const makeUniqueCode = useCallback((code, reservedSet) => {
        let finalCode = String(code || '').trim();
        if (!finalCode) finalCode = 'S';
        let base = finalCode; let counter = 0;
        while (subjects.some(s => s.code === finalCode) || reservedSet.has(finalCode)) {
            counter++;
            finalCode = `${base}_${counter}`;
        }
        reservedSet.add(finalCode);
        return finalCode;
    }, [subjects]);

    const relocateSubject = useCallback(async (subject, newParent) => {
        const nextLevel = newParent ? Number(newParent.level) + 1 : 1;
        const delta = nextLevel - Number(subject.level);
        if (delta === 0 && Number(subject.parent) === (newParent ? Number(newParent.id) : null)) return false;

        const subtree = collectSubtreeNodes(subject.id);
        for (const node of subtree) {
            const ml = Number(node.level) + delta;
            if (ml < 1 || ml > 4) throw new Error('이동 결과가 1~4계층 범위를 벗어납니다.');
        }
        await authAxios.patch(`/api/subjects/${subject.id}/`, { parent: newParent ? Number(newParent.id) : null, level: nextLevel });
        for (const node of subtree) {
            if (Number(node.id) === Number(subject.id)) continue;
            const ml = Number(node.level) + delta;
            if (ml !== Number(node.level)) await authAxios.patch(`/api/subjects/${node.id}/`, { level: ml });
        }
        // 로컬 상태 업데이트 (화면 전환 없이 반영)
        setLocalSubjects(prev => prev.map(s => {
            const node = subtree.find(n => Number(n.id) === Number(s.id));
            if (!node) return s;
            const ml = Number(node.level) + delta;
            if (Number(node.id) === Number(subject.id)) return { ...s, parent: newParent ? Number(newParent.id) : null, level: nextLevel };
            return { ...s, level: ml };
        }));
        return true;
    }, [authAxios, collectSubtreeNodes, setLocalSubjects]);

    // 승격: 현재 부모의 부모로 이동 (level -1)
    const promoteSubject = useCallback(async (subject) => {
        const parent = subject.parent ? subjectById.get(Number(subject.parent)) : null;
        if (!parent) { _alert('이미 최상위 계층입니다.'); return; }
        const grandParent = parent.parent ? subjectById.get(Number(parent.parent)) : null;
        try {
            setSubjectBusyId(subject.id);
            await relocateSubject(subject, grandParent || null);
            if (grandParent) setExpanded(prev => ({ ...prev, [grandParent.id]: true }));
        } catch (e) { _alert(e.message || '승격 실패'); }
        finally { setSubjectBusyId(null); }
    }, [subjectById, relocateSubject]);

    // 강등: 바로 위 형제 항목의 자식으로 이동 (level +1)
    const demoteSubject = useCallback(async (subject) => {
        const siblings = subjects.filter(s =>
            s.subject_type === subject.subject_type &&
            (s.parent == null ? null : Number(s.parent)) === (subject.parent == null ? null : Number(subject.parent)) &&
            Number(s.id) !== Number(subject.id)
        );
        if (siblings.length === 0) { _alert('강등할 형제 항목이 없습니다.'); return; }
        // visibleNodes 기준으로 바로 위 형제 찾기
        const myIdx = visibleNodes.findIndex(n => Number(n.id) === Number(subject.id));
        let prevSibling = null;
        for (let i = myIdx - 1; i >= 0; i--) {
            const node = visibleNodes[i];
            if ((node.parent == null ? null : Number(node.parent)) === (subject.parent == null ? null : Number(subject.parent)) && Number(node.id) !== Number(subject.id)) {
                prevSibling = node;
                break;
            }
        }
        if (!prevSibling) { _alert('위쪽에 이동 가능한 형제 항목이 없습니다.'); return; }
        if (Number(subject.level) >= 4) { _alert('4계층 이하로는 강등할 수 없습니다.'); return; }
        try {
            setSubjectBusyId(subject.id);
            await relocateSubject(subject, prevSibling);
            setExpanded(prev => ({ ...prev, [prevSibling.id]: true }));
        } catch (e) { _alert(e.message || '강등 실패'); }
        finally { setSubjectBusyId(null); }
    }, [subjects, visibleNodes, relocateSubject]);

    const onDragEnd = useCallback(async (result) => {
        const { source, destination } = result;
        if (!destination || source.index === destination.index) return;
        const subject = visibleNodes[source.index];
        const destNode = destination.index < visibleNodes.length ? visibleNodes[destination.index] : null;
        const prevNode = destination.index > 0 ? visibleNodes[destination.index - 1] : null;
        if (!subject) return;

        // 같은 부모 내 순서 변경인지 판별
        const destParentId = destNode
            ? (destNode.parent == null ? null : Number(destNode.parent))
            : (prevNode ? (prevNode.parent == null ? null : Number(prevNode.parent)) : null);
        const srcParentId = subject.parent == null ? null : Number(subject.parent);
        const isSameParent = srcParentId === destParentId;

        if (isSameParent) {
            // 같은 부모 내 순서 변경 → reorder API 호출
            const siblings = visibleNodes.filter(n =>
                (n.parent == null ? null : Number(n.parent)) === srcParentId &&
                n.subject_type === subject.subject_type
            );
            // 드래그된 항목을 목적지 위치에 삽입
            const reordered = siblings.filter(n => Number(n.id) !== Number(subject.id));
            const destInSiblings = siblings.findIndex(n => Number(n.id) === (destNode ? Number(destNode.id) : -1));
            const insertAt = destInSiblings >= 0 ? destInSiblings : reordered.length;
            reordered.splice(insertAt, 0, subject);
            const orderedIds = reordered.map(n => n.id);
            try {
                setSubjectBusyId(subject.id);
                await authAxios.post('/api/subjects/reorder/', { ordered_ids: orderedIds });
                setLocalSubjects(prev => {
                    const updated = [...prev];
                    reordered.forEach((n, idx) => {
                        const i = updated.findIndex(s => Number(s.id) === Number(n.id));
                        if (i >= 0) updated[i] = { ...updated[i], sort_order: idx };
                    });
                    return updated;
                });
            } catch (e) { _alert(e.message || '순서 변경 실패'); }
            finally { setSubjectBusyId(null); }
            return;
        }

        // 다른 부모로 이동 → 계층 이동
        let newParent = null;
        if (destination.index > 0 && prevNode) {
            newParent = (expanded[prevNode.id] && prevNode.children?.length > 0)
                ? prevNode
                : (prevNode.parent ? subjectById.get(Number(prevNode.parent)) : null);
        }
        try {
            setSubjectBusyId(subject.id);
            const changed = await relocateSubject(subject, newParent);
            if (changed && newParent) setExpanded(prev => ({ ...prev, [newParent.id]: true }));
        } catch (e) { _alert(e.message || '이동 실패'); }
        finally { setSubjectBusyId(null); }
    }, [visibleNodes, expanded, subjectById, relocateSubject, authAxios, setLocalSubjects]);

    const copySubjectToClipboard = useCallback(async (subject) => {
        const subtree = collectSubtreeNodes(subject.id);
        if (subtree.length === 0) return;
        const subtreeIdSet = new Set(subtree.map(n => Number(n.id)));
        const payload = {
            mode: 'copy', copiedAt: Date.now(), rootId: Number(subject.id), rootLevel: Number(subject.level),
            items: subtree.map(node => {
                const parentId = node.parent == null ? null : Number(node.parent);
                const parentCode = parentId && subtreeIdSet.has(parentId) ? subjectById.get(parentId)?.code || '' : '';
                return { id: Number(node.id), code: String(node.code || ''), name: String(node.name || ''), level: Number(node.level), parentId, parentCode };
            }),
        };
        subjectClipboardRef.current = payload;
        setCopiedSubjectName(subject.name);
        setClipboardMode('copy');
        setHasClipboard(true);
        const tsvRows = ['code\tname\tlevel\tparent_code'];
        payload.items.forEach(item => tsvRows.push([item.code, item.name, String(item.level), item.parentCode || ''].join('\t')));
        await copyTextToClipboard(tsvRows.join('\n'));
        _alert(`"${subject.name}" 항목(하위 ${subtree.length - 1}개 포함)을 복사했습니다.`);
    }, [collectSubtreeNodes, subjectById]);

    const cutSubjectToClipboard = useCallback((subject) => {
        const subtree = collectSubtreeNodes(subject.id);
        if (subtree.length === 0) return;
        const subtreeIdSet = new Set(subtree.map(n => Number(n.id)));
        const payload = {
            mode: 'cut', cutAt: Date.now(), rootId: Number(subject.id), rootLevel: Number(subject.level),
            items: subtree.map(node => {
                const parentId = node.parent == null ? null : Number(node.parent);
                const parentCode = parentId && subtreeIdSet.has(parentId) ? subjectById.get(parentId)?.code || '' : '';
                return { id: Number(node.id), code: String(node.code || ''), name: String(node.name || ''), level: Number(node.level), parentId, parentCode };
            }),
        };
        subjectClipboardRef.current = payload;
        setCopiedSubjectName(subject.name);
        setClipboardMode('cut');
        setHasClipboard(true);
        _alert(`"${subject.name}" 항목(하위 ${subtree.length - 1}개 포함)을 잘라냈습니다. 이동할 위치에서 붙여넣기 하세요.`);
    }, [collectSubtreeNodes, subjectById]);

    const pasteSubjectFromClipboard = useCallback(async (target) => {
        const clip = subjectClipboardRef.current;
        if (!clip || !Array.isArray(clip.items) || clip.items.length === 0) { _alert('먼저 복사하거나 잘라낼 항목을 선택하세요.'); return; }
        if (clip.mode === 'cut') {
            const rootSubject = subjectById.get(clip.rootId);
            if (!rootSubject) { _alert('원본 항목을 찾을 수 없습니다.'); return; }
            if (Number(target?.id) === clip.rootId) { _alert('같은 위치에는 이동할 수 없습니다.'); return; }
            const cutIds = new Set(clip.items.map(i => i.id));
            if (cutIds.has(Number(target?.id))) { _alert('잘라낸 항목의 하위 항목으로는 이동할 수 없습니다.'); return; }
            try {
                setSubjectBusyId(clip.rootId);
                const changed = await relocateSubject(rootSubject, target || null);
                if (changed && target) setExpanded(prev => ({ ...prev, [target.id]: true }));
                subjectClipboardRef.current = null;
                setCopiedSubjectName('');
                setClipboardMode(null);
                setHasClipboard(false);
                _alert(`"${rootSubject.name}" 항목을 이동했습니다.`);
            } catch (e) { _alert(apiErrorMessage(e, '이동 실패')); }
            finally { setSubjectBusyId(null); }
            return;
        }
        let targetParent = target;
        if (targetParent && Number(targetParent.level) >= 4) targetParent = targetParent.parent ? subjectById.get(Number(targetParent.parent)) || null : null;
        const nextRootLevel = targetParent ? Number(targetParent.level) + 1 : 1;
        const delta = nextRootLevel - Number(clip.rootLevel || 1);
        const maxAfterPaste = Math.max(...clip.items.map(item => Number(item.level) + delta));
        if (maxAfterPaste > 4) { _alert('해당 위치에는 붙여넣을 수 없습니다. (4계층 초과)'); return; }
        const reservedCodes = new Set();
        const idMap = new Map();
        const sortedItems = [...clip.items].sort((a, b) => a.level - b.level);
        const rootId = Number(clip.rootId);
        setSubjectBusyId(Number(target?.id || 0));
        try {
            const newNodes = [];
            for (const item of sortedItems) {
                const isRoot = Number(item.id) === rootId;
                const parent = isRoot ? targetParent : idMap.has(Number(item.parentId)) ? { id: idMap.get(Number(item.parentId)) } : null;
                const parentLevel = isRoot ? (targetParent ? Number(targetParent.level) : 0) : (item.level + delta - 1);
                const createLevel = parent ? parentLevel + 1 : 1;
                const uniqueCode = makeUniqueCode(item.code, reservedCodes);
                const res = await authAxios.post('/api/subjects/', { code: uniqueCode, name: item.name, parent: parent ? Number(parent.id) : null, level: createLevel, subject_type: typeTab });
                idMap.set(Number(item.id), Number(res.data.id));
                newNodes.push(res.data);
            }
            setLocalSubjects(prev => [...prev, ...newNodes]);
            if (targetParent) setExpanded(prev => ({ ...prev, [targetParent.id]: true }));
            _alert('붙여넣기가 완료되었습니다.');
        } catch (e) { _alert(apiErrorMessage(e, '붙여넣기 실패')); }
        finally { setSubjectBusyId(null); }
    }, [authAxios, makeUniqueCode, subjectById, typeTab, relocateSubject, setLocalSubjects]);

    const copyTreeAsSheet = useCallback(async () => {
        const rows = ['code\tname\tlevel\tparent_code\tsubject_type'];
        const walk = (nodes) => nodes.forEach(node => {
            const parentCode = node.parent ? subjectById.get(Number(node.parent))?.code || '' : '';
            rows.push([node.code, node.name, String(node.level), parentCode, node.subject_type].join('\t'));
            if (node.children.length > 0) walk(node.children);
        });
        walk(tree);
        const text = rows.join('\n');
        setSheetText(text);
        const copied = await copyTextToClipboard(text);
        _alert(copied ? '계정 체제를 TSV 형식으로 클립보드에 복사했습니다.' : '시트 내용을 생성했습니다. 텍스트를 수동 복사하세요.');
    }, [tree, subjectById]);

    const applySheetPaste = useCallback(async () => {
        const lines = String(sheetText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return _alert('붙여넣을 내용이 없습니다.');
        const split = (line) => line.split('\t').map(cell => String(cell || '').trim());
        let dataLines = [...lines];
        const header = split(lines[0]).map(c => c.toLowerCase());
        if (header.some(c => c === 'code' || c.includes('코드'))) dataLines = lines.slice(1);
        const rows = [];
        dataLines.forEach(line => {
            const cells = split(line);
            if (cells.length < 2) return;
            const code = cells[0]; const name = cells[1];
            if (!code || !name) return;
            const hasLevelCell = /^\d+$/.test(cells[2] || '');
            const parentCode = hasLevelCell ? (cells[3] || '') : (cells[2] || '');
            rows.push({ code, name, parentCode });
        });
        if (rows.length === 0) return _alert('유효한 데이터 행을 찾을 수 없습니다.');
        if (!await _confirm(`${rows.length}개의 항목을 일괄 등록하시겠습니까?`)) return;

        setSheetBusy(true);
        let successCount = 0; let failCount = 0;
        try {
            const codeToId = new Map(subjects.filter(s => s.subject_type === typeTab).map(s => [s.code, s.id]));
            for (const row of rows) {
                if (codeToId.has(row.code)) { successCount++; continue; }
                const parentId = row.parentCode ? codeToId.get(row.parentCode) || null : null;
                let lvl = 1;
                if (parentId) {
                    const p = subjects.find(s => s.id === parentId);
                    if (p) lvl = Number(p.level) + 1;
                }
                if (lvl > 4) { failCount++; continue; }
                try {
                    const res = await authAxios.post('/api/subjects/', { code: row.code, name: row.name, parent: parentId, level: lvl, subject_type: typeTab });
                    codeToId.set(row.code, res.data.id);
                    successCount++;
                } catch { failCount++; }
            }
            await onRefresh();
            _alert(`일괄 등록 완료 (성공: ${successCount}, 실패: ${failCount})`);
            setSheetOpen(false);
        } catch (e) { _alert(apiErrorMessage(e, '일괄 등록 중 오류')); }
        finally { setSheetBusy(false); }
    }, [sheetText, subjects, typeTab, authAxios, onRefresh]);

    return {
        editingId, setEditingId, editData, setEditData, expanded, setExpanded, searchText, setSearchText,
        sheetOpen, setSheetOpen, sheetText, setSheetText, sheetBusy, setSheetBusy,
        addModal, setAddModal, subjectBusyId, setSubjectBusyId,
        copiedSubjectName, setCopiedSubjectName, clipboardMode, setClipboardMode, hasClipboard, setHasClipboard,
        subjectById, tree, visibleNodes, countDescendants, toggle, startEdit, cancelEdit, saveEdit,
        expandAll, collapseAll, expandToLevel, allIds, subjectClipboardRef,
        deleteSubject, confirmAddSubject, onDragEnd, copySubjectToClipboard, cutSubjectToClipboard,
        pasteSubjectFromClipboard, copyTreeAsSheet, applySheetPaste, promoteSubject, demoteSubject
    };
}
