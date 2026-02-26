
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, TriangleAlert } from 'lucide-react';
import { MenuShell, Modal } from '../../shared/menuUi';
import { apiErrorMessage } from '../../shared/utils';
import VersionList from './VersionList';
import VersionDetail from './VersionDetail';
import VersionForm from './VersionForm';
import { VERSION_INTAKE_STRINGS as S } from './constants';

export default function VersionIntakePage({
    menuId, authAxios, version, versions, setVersion, onBootstrap, user, modalApi, initialUrlParams = {}
}) {
    const getInitialCreateData = () => ({
        year: new Date().getFullYear(),
        name: '',
        start_date: '',
        end_date: '',
        guidelines: '',
        file: null,
        creation_mode: 'NEW',
        source_version_id: '',
    });

    const [viewMode, setViewMode] = useState(() =>
        initialUrlParams.versionId ? 'detail' : 'list'
    );
    const [statusById, setStatusById] = useState({});
    const [, setSavingId] = useState(null);
    const [progressMap, setProgressMap] = useState({});
    const [loadingProgress, setLoadingProgress] = useState(false);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());


    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [forceDeleteDialog, setForceDeleteDialog] = useState(null); // { version, entryCount }
    const [forceDeleteInput, setForceDeleteInput] = useState('');
    const forceDeleteInputRef = useRef(null);

    const [createData, setCreateData] = useState(getInitialCreateData());
    const [editData, setEditData] = useState({ year: '', name: '', start_date: '', end_date: '', guidelines: '' });

    // UI States
    const [isBulkExpanded, setIsBulkExpanded] = useState(false);
    const [csvContent, setCsvContent] = useState('');
    const [, setBulkResult] = useState(null);

    const canManage = user?.role === 'ADMIN';

    const fetchProgress = useCallback(async (vId) => {
        const targetId = vId || version?.id;
        if (!targetId) return;
        setLoadingProgress(true);
        try {
            const res = await authAxios.get(`/api/versions/${targetId}/progress/`);
            setProgressMap(prev => ({ ...prev, [targetId]: res.data }));
        } catch (e) { console.error(e); }
        finally { setLoadingProgress(false); }
    }, [authAxios, version?.id]);

    useEffect(() => {
        const next = {};
        versions.forEach(item => { next[item.id] = item.status; });
        setStatusById(next);
    }, [versions]);

    useEffect(() => {
        if (viewMode === 'list') {
            const activeVersions = versions.filter(v => ['PENDING', 'DRAFT', 'EXPIRED'].includes(v.status));
            activeVersions.forEach(v => {
                if (!progressMap[v.id]) {
                    fetchProgress(v.id);
                }
            });
        }
    }, [viewMode, versions, progressMap, fetchProgress]);

    useEffect(() => {
        if (version && version.id) {
            if (viewMode === 'detail') {
                fetchProgress(version.id);
            }
            setEditData({
                year: version.year,
                name: version.name,
                start_date: version.start_date || '',
                end_date: version.end_date || '',
                guidelines: version.guidelines || ''
            });
        }
    }, [version, viewMode, fetchProgress]);

    // URL의 versionId로 초기 상세 뷰 복원 (versions 로드 후 한 번만)
    const initialVersionIdRestoredRef = useRef(false);
    useEffect(() => {
        if (initialVersionIdRestoredRef.current) return;
        if (!versions.length) return;
        const targetId = initialUrlParams.versionId;
        if (!targetId) return;
        const found = versions.find(v => v.id === targetId);
        if (found) {
            setVersion(found);
            setViewMode('detail');
        }
        initialVersionIdRestoredRef.current = true;
    }, [versions, initialUrlParams.versionId, setVersion]);

    // viewMode / version.id 변경 → URL 동기화
    useEffect(() => {
        if (viewMode === 'detail' && version?.id) {
            const next = `/intake/versions/${version.id}`;
            if (window.location.pathname !== next) {
                window.history.pushState({}, '', next);
            }
        } else if (viewMode === 'list') {
            if (window.location.pathname !== '/intake') {
                window.history.pushState({}, '', '/intake');
            }
        }
    }, [viewMode, version?.id]);

    const transferSourceOptions = useMemo(() => {
        return [...versions].sort((a, b) => b.year - a.year || b.round - a.round);
    }, [versions]);

    const availableYears = useMemo(() => {
        const years = new Set(versions.map(v => v.year.toString()));
        return Array.from(years).sort((a, b) => b - a);
    }, [versions]);

    const filteredVersions = useMemo(() => {
        if (filterYear === 'ALL') return versions;
        return versions.filter(v => v.year.toString() === filterYear);
    }, [versions, filterYear]);


    const handleDeleteVersion = async (v) => {
        if (!await modalApi.confirm(S.confirmDelete(v.name))) return;
        try {
            await authAxios.delete(`/api/versions/${v.id}/`);
            await onBootstrap();
            await modalApi.alert(S.deleteSuccess);
        } catch (e) {
            if (e.response?.status === 409 && e.response?.data?.can_force) {
                const entryCount = e.response.data.entry_count;
                setForceDeleteInput('');
                setForceDeleteDialog({ version: v, entryCount });
                setTimeout(() => forceDeleteInputRef.current?.focus(), 80);
            } else {
                await modalApi.alert(apiErrorMessage(e, S.deleteFail));
            }
        }
    };

    const handleForceDelete = async () => {
        if (!forceDeleteDialog) return;
        try {
            await authAxios.delete(`/api/versions/${forceDeleteDialog.version.id}/force-delete/`);
            setForceDeleteDialog(null);
            await onBootstrap();
            await modalApi.alert(S.deleteSuccess);
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, S.deleteFail));
        }
    };

    const handleCloseVersion = async (v) => {
        if (!await modalApi.confirm(S.confirmClose(v.name))) return;
        try {
            await authAxios.post(`/api/versions/${v.id}/close/`);
            await onBootstrap();
            await modalApi.alert(S.closeSuccess);
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, S.closeFail));
        }
    };

    const handleReopenVersion = async (v) => {
        if (!await modalApi.confirm(S.confirmReopen(v.name))) return;
        try {
            await authAxios.post(`/api/versions/${v.id}/reopen/`);
            await onBootstrap();
            await modalApi.alert(S.reopenSuccess);
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, S.reopenFail));
        }
    };

    const _handleDeactivateVersion = async (v) => {
        if (v.status === 'CLOSED') return modalApi.alert(S.alreadyClosed);
        if (!await modalApi.confirm(S.confirmDeactivate(v.name))) return;
        try {
            await authAxios.patch(`/api/versions/${v.id}/`, { status: 'CLOSED' });
            await onBootstrap();
            await modalApi.alert(S.deactivateSuccess);
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, S.changeFail));
        }
    };

    const handleCreateVersion = async () => {
        try {
            if (createData.creation_mode === 'TRANSFER' && !createData.source_version_id) {
                await modalApi.alert(S.transferRequired);
                return;
            }

            const formData = new FormData();
            formData.append('year', createData.year);
            formData.append('name', createData.name || S.newRoundName(createData.year));
            formData.append('start_date', createData.start_date);
            formData.append('end_date', createData.end_date);
            formData.append('guidelines', createData.guidelines);
            formData.append('creation_mode', createData.creation_mode || 'NEW');
            formData.append('base_data_mode', (createData.creation_mode || 'NEW') === 'TRANSFER' ? 'IMPORT_PREVIOUS' : 'NEW');
            if (createData.source_version_id) {
                formData.append('source_version_id', createData.source_version_id);
                formData.append('base_version_id', createData.source_version_id);
            }
            if (createData.file) {
                formData.append('guidelines_file', createData.file);
            }

            const res = await authAxios.post('/api/versions/create_next_round/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await onBootstrap();
            setIsCreateModalOpen(false);
            setCreateData(getInitialCreateData());
            const clonedCount = Number(res?.data?.cloned_count || 0);
            await modalApi.alert(S.createSuccess(clonedCount));
        } catch (e) {
            const errMsg = e?.response?.data?.error;
            const msg = errMsg === 'source version has no entries'
                ? S.sourceVersionEmpty
                : apiErrorMessage(e, S.createFail);
            await modalApi.alert(msg);
        }
    };

    const saveVersionStatus = async (item) => {
        const nextStatus = statusById[item.id];
        if (!nextStatus || nextStatus === item.status) return;
        setSavingId(item.id);
        try {
            await authAxios.patch(`/api/versions/${item.id}/`, { status: nextStatus, confirmed_at: nextStatus === 'CONFIRMED' ? new Date().toISOString() : null });
            await onBootstrap();
            await modalApi.alert(S.updateSuccess);
        } catch (e) { await modalApi.alert(apiErrorMessage(e, S.updateFail)); }
        finally { setSavingId(null); }
    };

    const saveVersionDetails = async () => {
        if (!version) return;
        try {
            const formData = new FormData();
            formData.append('year', editData.year);
            formData.append('name', editData.name);
            formData.append('start_date', editData.start_date);
            formData.append('end_date', editData.end_date);
            formData.append('guidelines', editData.guidelines);
            if (editData.file) {
                formData.append('guidelines_file', editData.file);
            } else if (editData.file === null && version.guidelines_file) { // If file was cleared
                formData.append('guidelines_file', ''); // Send empty string to clear existing file
            }

            const res = await authAxios.patch(`/api/versions/${version.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setVersion(res.data);
            await onBootstrap();
            setIsEditModalOpen(false);
            setEditData({ year: '', name: '', start_date: '', end_date: '', guidelines: '', file: null }); // Reset form
            await modalApi.alert(S.saveSuccess);
        } catch (e) { await modalApi.alert(apiErrorMessage(e, S.saveFail)); }
    };

    const handleBulkUpload = async () => {
        if (!csvContent.trim()) return modalApi.alert(S.inputRequired);
        try {
            const lines = csvContent.trim().split('\n');
            const entries = lines.map(line => {
                const [subject_code, org_code, name, price, qty] = line.split(',').map(s => s.trim());
                return { subject_code, org_code, details: [{ name, price: parseInt(price) || 0, qty: parseFloat(qty) || 0, freq: 1, source: '자체' }] };
            }).filter(e => e.subject_code && e.org_code);
            const res = await authAxios.post('/api/entries/bulk-upsert/', { year: version.year, round: version.round || 0, entries });
            setBulkResult(res.data);
            await onBootstrap();
            setCsvContent('');
            await modalApi.alert(S.uploadSuccess(res.data.created, res.data.updated));
            fetchProgress(version.id);
        } catch (e) { await modalApi.alert(apiErrorMessage(e, S.uploadFail)); }
    };

    const handleBatchDelete = async (ids) => {
        if (!ids?.length) return;
        if (!await modalApi.confirm(`선택한 ${ids.length}개의 예산서를 삭제하시겠습니까?`)) return;
        try {
            const res = await authAxios.post('/api/versions/bulk-delete/', { ids });
            const deletedCount = res.data.deleted_ids?.length || 0;
            const errorCount = res.data.errors?.length || 0;

            await onBootstrap();

            if (errorCount > 0) {
                // If force delete is needed for some
                const needsForce = res.data.errors.filter(err => err.entry_count > 0);
                if (needsForce.length > 0) {
                    if (await modalApi.confirm(`${needsForce.length}개의 예산서에 기존 데이터가 존재합니다. 강제로 삭제하시겠습니까?`)) {
                        await authAxios.post('/api/versions/bulk-delete/', { ids: needsForce.map(n => n.id), force: true });
                        await onBootstrap();
                        await modalApi.alert('강제 삭제가 완료되었습니다.');
                    }
                } else {
                    await modalApi.alert(`${deletedCount}개 삭제 성공, ${errorCount}개 실패.`);
                }
            } else {
                await modalApi.alert(`${deletedCount}개의 예산서가 삭제되었습니다.`);
            }
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, '일괄 삭제에 실패했습니다.'));
        }
    };

    const handleBatchUpdateStatus = async (ids, nextStatus) => {
        if (!ids?.length) return;
        try {
            await authAxios.post('/api/versions/bulk-update-status/', { ids, status: nextStatus });
            await onBootstrap();
            await modalApi.alert('상태 변경이 완료되었습니다.');
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, '상태 변경에 실패했습니다.'));
        }
    };

    const handleGoDetail = (v) => { setVersion(v); setViewMode('detail'); };


    const handleExportBudgetBook = async () => {
        if (!version?.id) return;
        try {
            const res = await authAxios.get(`/api/versions/${version.id}/export-budget-book/`, {
                responseType: 'blob'
            });
            const contentDisposition = res.headers?.['content-disposition'] || '';
            const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
            const fallbackName = `budget_book_${version.year}_r${version.round}.xlsx`;
            const fileName = match ? decodeURIComponent(match[1]) : fallbackName;

            const blob = new Blob([res.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            await modalApi.alert(S.exportOfficialBookDone);
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, S.exportOfficialBookFail));
        }
    };

    return (
        <MenuShell
            menuId={menuId}
            user={user}
            breadcrumbs={viewMode === 'detail'
                ? [
                    { label: S.pageTitle, onClick: () => setViewMode('list') },
                    { label: S.listTitle, onClick: () => setViewMode('list') },
                    `${S.detailTitle} (${version?.name || ''})`
                ]
                : [S.pageTitle, S.listTitle]}
            contextBadge={viewMode === 'list' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>예산연도</span>
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        style={{
                            padding: '3px 10px',
                            borderRadius: 8,
                            border: '1px solid #cbd5e1',
                            background: '#fff',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#0891b2',
                            cursor: 'pointer',
                            outline: 'none',
                        }}
                    >
                        <option value="ALL">전체보기</option>
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}년</option>
                        ))}
                    </select>
                </div>
            ) : (version ? `${version.year}년 ${version.name}` : '')}
            hideHero={true}
        >


            <div style={{ padding: '0 20px 40px 20px' }}>
                {viewMode === 'list' ? (
                    <VersionList
                        versions={filteredVersions}

                        version={version}
                        setVersion={setVersion}
                        setViewMode={setViewMode}
                        canManage={canManage}
                        statusById={statusById}
                        setStatusById={setStatusById}
                        saveVersionStatus={saveVersionStatus}
                        handleGoDetail={handleGoDetail}
                        setIsEditModalOpen={setIsEditModalOpen}
                        handleCloseVersion={handleCloseVersion}
                        handleReopenVersion={handleReopenVersion}
                        handleDeleteVersion={handleDeleteVersion}
                        setIsCreateModalOpen={setIsCreateModalOpen}
                        progressMap={progressMap}
                        handleBatchDelete={handleBatchDelete}
                        handleBatchUpdateStatus={handleBatchUpdateStatus}
                    />

                ) : (
                    <VersionDetail
                        version={version}
                        canManage={canManage}
                        setViewMode={setViewMode}
                        fetchProgress={fetchProgress}
                        progressData={progressMap[version?.id] || []}
                        loadingProgress={loadingProgress}
                        setIsEditModalOpen={setIsEditModalOpen}
                        handleBulkUpload={handleBulkUpload}
                        csvContent={csvContent}
                        setCsvContent={setCsvContent}
                        isBulkExpanded={isBulkExpanded}
                        setIsBulkExpanded={setIsBulkExpanded}
                        onExportBudgetBook={handleExportBudgetBook}
                        onClose={handleCloseVersion}
                        onReopen={handleReopenVersion}
                    />
                )}
            </div>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={S.newRoundBtn}
                width={560}
                footer={(
                    <>
                        <button
                            type="button"
                            style={{
                                background: '#fff',
                                color: '#64748b',
                                border: '1px solid #cbd5e1',
                                padding: '10px 20px',
                                borderRadius: 10,
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: 'pointer',
                            }}
                            onClick={() => setIsCreateModalOpen(false)}
                        >
                            {S.cancel}
                        </button>
                        <button
                            type="button"
                            style={{
                                background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 28px',
                                borderRadius: 10,
                                fontWeight: 800,
                                fontSize: 14,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                                transition: 'all 0.2s'
                            }}
                            onClick={handleCreateVersion}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                        >
                            {S.newRoundBtn}
                        </button>
                    </>
                )}
            >
                <VersionForm data={createData} setData={setCreateData} isCreate={true} fileInputId="version-file-input-create" transferSourceOptions={transferSourceOptions} />
            </Modal>


            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={S.editRoundBtn}
                width={560}
                footer={(
                    <>
                        <button
                            type="button"
                            style={{
                                background: '#fff',
                                color: '#64748b',
                                border: '1px solid #cbd5e1',
                                padding: '10px 20px',
                                borderRadius: 10,
                                fontWeight: 700,
                                fontSize: 14,
                                cursor: 'pointer',
                            }}
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            {S.cancel}
                        </button>
                        <button
                            type="button"
                            style={{
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 28px',
                                borderRadius: 10,
                                fontWeight: 800,
                                fontSize: 14,
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                                transition: 'all 0.2s'
                            }}
                            onClick={saveVersionDetails}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                        >
                            {S.save}
                        </button>
                    </>
                )}
            >
                <VersionForm data={editData} setData={setEditData} currentFileUrl={version?.guidelines_file} fileInputId="version-file-input-edit" />
            </Modal>


            {/* 강제 삭제 2중 확인 다이얼로그 */}
            {forceDeleteDialog && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(3px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 20, width: 480, maxWidth: '90vw',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
                        overflow: 'hidden',
                    }}>
                        {/* 헤더 */}
                        <div style={{
                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
                        }}>
                            <TriangleAlert size={22} color="#fff" />
                            <span style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>예산서 강제 삭제</span>
                        </div>

                        {/* 본문 */}
                        <div style={{ padding: '24px 24px 20px' }}>
                            <div style={{
                                background: '#fef2f2', border: '1px solid #fca5a5',
                                borderRadius: 12, padding: '14px 16px', marginBottom: 20,
                            }}>
                                <p style={{ margin: 0, fontWeight: 700, color: '#b91c1c', fontSize: 14, marginBottom: 6 }}>
                                    ⚠ 이 작업은 되돌릴 수 없습니다
                                </p>
                                <p style={{ margin: 0, color: '#7f1d1d', fontSize: 13, lineHeight: 1.6 }}>
                                    <strong>"{forceDeleteDialog.version.name}"</strong> 예산서와 연결된{' '}
                                    <strong>예산 항목 {forceDeleteDialog.entryCount.toLocaleString()}건</strong>이
                                    모두 영구 삭제됩니다.
                                </p>
                            </div>

                            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#475569', fontWeight: 600 }}>
                                계속하려면 아래 입력란에 <code style={{
                                    background: '#f1f5f9', padding: '2px 7px', borderRadius: 5,
                                    fontFamily: 'monospace', fontWeight: 800, color: '#dc2626', fontSize: 13,
                                }}>DELETE</code> 를 입력하세요.
                            </p>
                            <input
                                ref={forceDeleteInputRef}
                                type="text"
                                value={forceDeleteInput}
                                onChange={e => setForceDeleteInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && forceDeleteInput === 'DELETE') handleForceDelete(); }}
                                placeholder="DELETE"
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    border: `2px solid ${forceDeleteInput === 'DELETE' ? '#dc2626' : '#e2e8f0'}`,
                                    borderRadius: 10, padding: '10px 14px',
                                    fontSize: 15, fontWeight: 700, fontFamily: 'monospace',
                                    outline: 'none', color: '#0f172a',
                                    transition: 'border-color 0.2s',
                                }}
                            />
                        </div>

                        {/* 푸터 */}
                        <div style={{
                            padding: '0 24px 24px',
                            display: 'flex', gap: 10, justifyContent: 'flex-end',
                        }}>
                            <button
                                type="button"
                                onClick={() => { setForceDeleteDialog(null); setForceDeleteInput(''); }}
                                style={{
                                    padding: '10px 22px', borderRadius: 10, border: '1px solid #e2e8f0',
                                    background: '#f8fafc', color: '#475569', fontWeight: 700,
                                    cursor: 'pointer', fontSize: 14,
                                }}
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                disabled={forceDeleteInput !== 'DELETE'}
                                onClick={handleForceDelete}
                                style={{
                                    padding: '10px 22px', borderRadius: 10, border: 'none',
                                    background: forceDeleteInput === 'DELETE' ? '#dc2626' : '#fca5a5',
                                    color: '#fff', fontWeight: 800, fontSize: 14,
                                    cursor: forceDeleteInput === 'DELETE' ? 'pointer' : 'not-allowed',
                                    transition: 'background 0.2s',
                                    boxShadow: forceDeleteInput === 'DELETE' ? '0 4px 6px -1px rgba(220,38,38,0.3)' : 'none',
                                }}
                            >
                                강제 삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MenuShell>
    );
}
