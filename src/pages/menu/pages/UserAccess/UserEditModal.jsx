
import React from 'react';
import { X, Check } from 'lucide-react';
import { menuStyles } from '../../shared/menuUi';
import { getDepartmentOptions, getTeamOptionsForDepartment } from './orgUtils';

const { simpleInput, simpleSelect } = menuStyles;

const ROLE_OPTIONS = [
    { value: 'STAFF', label: '부서담당자' },
    { value: 'MANAGER', label: '총무팀' },
    { value: 'ADMIN', label: '시스템 관리자' },
    { value: 'ORG_VIEWER', label: '열람자' },
];

export default function UserEditModal({ isOpen, onClose, editForm, setEditForm, handleUpdateUser, orgs }) {
    if (!isOpen || !editForm) return null;
    const departmentOptions = getDepartmentOptions(orgs);
    const teamOptions = getTeamOptionsForDepartment(orgs, editForm.organization);

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }} onClick={onClose}>
            <div style={{
                backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '480px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: 16
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>사용자 정보 수정</h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                            아이디 <span style={{ fontWeight: 400, color: '#94a3b8' }}>(변경불가)</span>
                        </label>
                        <div style={{ padding: '10px 12px', background: '#f1f5f9', borderRadius: 6, color: '#64748b', fontSize: '14px', fontWeight: 600 }}>
                            {editForm.username}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>이름</label>
                        <input
                            style={{ ...simpleInput, width: '100%', boxSizing: 'border-box' }}
                            value={editForm.name}
                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>이메일</label>
                        <input
                            style={{ ...simpleInput, width: '100%', boxSizing: 'border-box' }}
                            value={editForm.email}
                            onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>역할</label>
                        <select
                            style={{ ...simpleSelect, width: '100%', boxSizing: 'border-box' }}
                            value={editForm.role}
                            onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                        >
                            {ROLE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>소속 부서</label>
                        <select
                            style={{ ...simpleSelect, width: '100%', boxSizing: 'border-box' }}
                            value={editForm.organization}
                            onChange={e => setEditForm(p => ({ ...p, organization: e.target.value, team: '' }))}
                        >
                            <option value="">부서 미지정</option>
                            {departmentOptions.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>소속 팀</label>
                        <select
                            style={{ ...simpleSelect, width: '100%', boxSizing: 'border-box' }}
                            value={editForm.team || ''}
                            onChange={e => setEditForm(p => ({ ...p, team: e.target.value }))}
                            disabled={!editForm.organization}
                        >
                            <option value="">팀 선택 (옵션)</option>
                            {teamOptions.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                            비밀번호 변경 <span style={{ fontWeight: 400, color: '#94a3b8' }}>(필요 시 입력)</span>
                        </label>
                        <input
                            type="password"
                            placeholder="새 비밀번호 입력"
                            style={{ ...simpleInput, width: '100%', boxSizing: 'border-box' }}
                            value={editForm.password}
                            onChange={e => setEditForm(p => ({ ...p, password: e.target.value }))}
                        />
                    </div>

                    <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <input
                            type="checkbox"
                            id="editIsActive"
                            style={{ width: 16, height: 16, margin: 0 }}
                            checked={editForm.is_active}
                            onChange={e => setEditForm(p => ({ ...p, is_active: e.target.checked }))}
                        />
                        <label htmlFor="editIsActive" style={{ fontSize: '14px', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }}>
                            계정 활성화 여부
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 18px', border: '1px solid #e2e8f0', borderRadius: '6px',
                            background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: '#64748b'
                        }}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleUpdateUser}
                        style={{
                            padding: '10px 24px', border: 'none', borderRadius: '6px',
                            background: '#3b82f6', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#fff',
                            display: 'flex', alignItems: 'center', gap: 6
                        }}
                    >
                        <Check size={16} /> 변경사항 저장
                    </button>
                </div>
            </div>
        </div>
    );
}
