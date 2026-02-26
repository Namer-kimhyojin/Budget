
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { MenuShell, menuStyles, EmptyState } from '../../shared/menuUi';
import { apiErrorMessage, toList } from '../../shared/utils';
import UserForm from './UserForm';
import UserList from './UserList';
import UserEditModal from './UserEditModal';
import UserImportModal from './UserImportModal';

const { menuPanelCard, menuPanelHead, menuPanelBody } = menuStyles;

const ROLE_LABELS = {
    ADMIN: '시스템 관리자',
    MANAGER: '총무팀',
    STAFF: '부서담당자',
    REVIEWER: '총무팀',    // 하위 호환
    REQUESTOR: '부서담당자', // 하위 호환
    ORG_VIEWER: '단순 조회자'
};

export default function UserAccessPage({ menuId, user, authAxios, modalApi, orgs = [] }) {
    const isAdmin = user?.role === 'ADMIN';

    const roleDescriptions = {
        ADMIN: '모든 메뉴 접근 가능. 회차 생성/관리, 사용자 및 권한 관리.',
        MANAGER: '전체 부서 예산 확인 및 편집. 수정요청·버전 마감 가능.',
        STAFF: '본인 부서 예산 편성·편집. 작성완료·질문·답변 등록 가능.',
        ORG_VIEWER: '대시보드와 보고서 조회만 가능.'
    };

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New User Form State
    const [newUser, setNewUser] = useState({ username: '', password: '', name: '', email: '', role: 'REQUESTOR', organization: '', team: '' });

    // Edit Modal State
    const [editUser, setEditUser] = useState(null); // The user being edited (original)
    const [editForm, setEditForm] = useState(null); // The form data
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Import Modal State
    const [showImportModal, setShowImportModal] = useState(false);
    const [importLoading, setImportLoading] = useState(false);

    const loadUsers = useCallback(async () => {
        if (!isAdmin) return;
        setLoading(true);
        try {
            const res = await authAxios.get('/api/auth/users/');
            const rows = Array.isArray(res.data) ? res.data : toList(res.data);
            setUsers(rows);
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, '사용자 목록 조회에 실패했습니다.'));
        } finally {
            setLoading(false);
        }
    }, [authAxios, isAdmin, modalApi]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const lower = searchTerm.toLowerCase();
        return users.filter(u =>
            u.username.toLowerCase().includes(lower) ||
            (u.name && u.name.toLowerCase().includes(lower))
        );
    }, [users, searchTerm]);

    const createUser = async () => {
        if (!newUser.username || !newUser.password) return modalApi.alert('아이디와 비밀번호는 필수입니다.');
        try {
            const payload = { ...newUser, organization: newUser.organization || null, team: newUser.team || null };
            await authAxios.post('/api/auth/users/', payload);
            setNewUser({ username: '', password: '', name: '', email: '', role: 'REQUESTOR', organization: '', team: '' });
            await loadUsers();
            await modalApi.alert('사용자가 생성되었습니다.');
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, '사용자 생성에 실패했습니다.'));
        }
    };

    const openEditModal = (targetUser) => {
        setEditUser(targetUser);
        setEditForm({
            username: targetUser.username,
            name: targetUser.name || '',
            email: targetUser.email || '',
            role: targetUser.role || 'REQUESTOR',
            organization: targetUser.organization || '',
            team: targetUser.team || '',
            is_active: targetUser.is_active,
            password: '' // Empty by default (no change)
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async () => {
        if (!editForm) return;
        try {
            const payload = {
                name: editForm.name,
                email: editForm.email,
                role: editForm.role,
                organization: editForm.organization || null,
                team: editForm.team || null,
                is_active: editForm.is_active
            };
            if (editForm.password && editForm.password.trim()) {
                payload.reset_password = editForm.password.trim();
            }

            await authAxios.patch(`/api/auth/users/${editUser.id}/`, payload);
            await loadUsers();
            setIsEditModalOpen(false);
            await modalApi.alert('사용자 정보가 수정되었습니다.');
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, '사용자 수정에 실패했습니다.'));
        }
    };

    const removeUser = async (id) => {
        const ok = await modalApi.confirm('해당 사용자를 삭제하시겠습니까?');
        if (!ok) return;
        try {
            await authAxios.delete(`/api/auth/users/${id}/`);
            await loadUsers();
            await modalApi.alert('사용자가 삭제되었습니다.');
        } catch (e) {
            await modalApi.alert(apiErrorMessage(e, '사용자 삭제에 실패했습니다.'));
        }
    };

    const downloadTemplate = async () => {
        const XLSX = await import('xlsx');
        const templateData = [
            { username: 'user001', password: 'password123', name: '홍길동', email: 'hong@example.com', role: 'STAFF', organization: '', team: '' },
            { username: 'user002', password: 'password456', name: '김영희', email: 'kim@example.com', role: 'MANAGER', organization: '', team: '' }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '사용자');
        XLSX.writeFile(wb, '사용자_임포트_템플릿.xlsx');
    };

    const handleImportFile = async (e) => {
        const XLSX = await import('xlsx');
        const file = e.target.files?.[0];
        if (!file) return;
        setImportLoading(true);
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws);

            if (data.length === 0) {
                await modalApi.alert('임포트할 사용자가 없습니다.');
                return;
            }

            const errors = [];
            data.forEach((row, idx) => {
                if (!row.username) errors.push(`${idx + 2}행: 아이디 필수`);
                if (!row.password) errors.push(`${idx + 2}행: 비밀번호 필수`);
                if (!row.role || !['ADMIN', 'MANAGER', 'STAFF', 'ORG_VIEWER'].includes(row.role)) errors.push(`${idx + 2}행: 유효한 역할 필수 (ADMIN/MANAGER/STAFF/ORG_VIEWER)`);
            });

            if (errors.length > 0) {
                await modalApi.alert(`검증 오류:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n외 ${errors.length - 5}건` : ''}`);
                return;
            }

            const ok = await modalApi.confirm(`${data.length}명의 사용자를 임포트하시겠습니까?`);
            if (!ok) return;

            let successCount = 0;
            let failCount = 0;

            for (const row of data) {
                try {
                    const payload = {
                        username: row.username,
                        password: row.password,
                        name: row.name || '',
                        email: row.email || '',
                        role: row.role || 'REQUESTOR',
                        organization: row.organization || null,
                        team: row.team || null
                    };
                    await authAxios.post('/api/auth/users/', payload);
                    successCount += 1;
                } catch {
                    failCount += 1;
                }
            }

            await modalApi.alert(`임포트 완료: 성공 ${successCount}명, 실패 ${failCount}명`);
            await loadUsers();
            setShowImportModal(false);
        } catch {
            await modalApi.alert('Excel 파일 읽기에 실패했습니다.');
        } finally {
            setImportLoading(false);
            e.target.value = '';
        }
    };

    if (!isAdmin) {
        return (
            <MenuShell menuId={menuId} user={user} stats={[{ label: '권한', value: 'ADMIN 필요' }]}>
                <section style={menuPanelCard}>
                    <div style={menuPanelHead}>접근 제한</div>
                    <div style={menuPanelBody}>
                        <EmptyState title="관리자만 접근할 수 있습니다" description="사용자 관리 기능은 시스템 관리자(ADMIN) 권한이 필요합니다." />
                    </div>
                </section>
                <section style={menuPanelCard}>
                    <div style={menuPanelHead}>역할별 설명</div>
                    <div style={menuPanelBody}>
                        {Object.entries(roleDescriptions).map(([role, desc]) => (
                            <div key={role} style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '3px solid #3b82f6', marginBottom: '8px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#1e40af', marginBottom: '4px' }}>
                                    {ROLE_LABELS[role]} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>({role})</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569' }}>{desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </MenuShell>
        );
    }

    return (
        <MenuShell
            menuId={menuId}
            user={user}
            actions={[
                { label: '목록 새로고침', onClick: loadUsers, disabled: loading, icon: <div style={{ width: 14, height: 14, background: 'currentColor', borderRadius: '50%' }} /> },
                { label: '일괄 임포트', onClick: () => setShowImportModal(true) },
                { label: '템플릿 다운로드', onClick: downloadTemplate }
            ]}
            stats={[{ label: '전체 사용자', value: `${users.length}명` }]}
        >
            <UserForm newUser={newUser} setNewUser={setNewUser} createUser={createUser} orgs={orgs} />
            <UserList
                filteredUsers={filteredUsers}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                openEditModal={openEditModal}
                removeUser={removeUser}
                orgs={orgs}
            />
            <UserEditModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                editForm={editForm}
                setEditForm={setEditForm}
                handleUpdateUser={handleUpdateUser}
                orgs={orgs}
            />
            <UserImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                handleImportFile={handleImportFile}
                importLoading={importLoading}
                downloadTemplate={downloadTemplate}
            />
        </MenuShell>
    );
}
