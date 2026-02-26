
import React from 'react';
import { UserPlus } from 'lucide-react';
import { menuStyles } from '../../shared/menuUi';
import { getDepartmentOptions, getTeamOptionsForDepartment } from './orgUtils';

const { menuPanelCard, menuPanelHead, menuPanelBody, rowInline, simpleInput, simpleSelect, menuGhostBtn } = menuStyles;

const ROLE_OPTIONS = [
    { value: 'STAFF', label: '부서담당자' },
    { value: 'MANAGER', label: '총무팀' },
    { value: 'ADMIN', label: '시스템 관리자' },
    { value: 'ORG_VIEWER', label: '열람자' },
];

export default function UserForm({ newUser, setNewUser, createUser, orgs }) {
    const departmentOptions = getDepartmentOptions(orgs);
    const teamOptions = getTeamOptionsForDepartment(orgs, newUser.organization);

    return (
        <section style={menuPanelCard}>
            <div style={menuPanelHead}>
                <span>신규 사용자 등록</span>
            </div>
            <div style={{ ...menuPanelBody, gap: 10 }}>
                <div style={rowInline}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: 4 }}>아이디 <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                            style={{ ...simpleInput, width: '100%' }}
                            placeholder="아이디 입력 (영문/숫자)"
                            value={newUser.username}
                            onChange={e => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: 4 }}>비밀번호 <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                            style={{ ...simpleInput, width: '100%' }}
                            placeholder="초기 비밀번호"
                            type="password"
                            value={newUser.password}
                            onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: 4 }}>이름</label>
                        <input
                            style={{ ...simpleInput, width: '100%' }}
                            placeholder="사용자 성명"
                            value={newUser.name}
                            onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>
                </div>
                <div style={rowInline}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: 4 }}>이메일</label>
                        <input
                            style={{ ...simpleInput, width: '100%' }}
                            placeholder="user@example.com"
                            value={newUser.email}
                            onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: 4 }}>역할(권한)</label>
                        <select
                            style={{ ...simpleSelect, width: '100%' }}
                            value={newUser.role}
                            onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                        >
                            {ROLE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: 4 }}>소속 부서</label>
                        <select
                            style={{ ...simpleSelect, width: '100%' }}
                            value={newUser.organization}
                            onChange={e => setNewUser(prev => ({ ...prev, organization: e.target.value, team: '' }))}
                        >
                            <option value="">부서 미지정 (공통/본점 등)</option>
                            {departmentOptions.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: 4 }}>소속 팀</label>
                        <select
                            style={{ ...simpleSelect, width: '100%' }}
                            value={newUser.team || ''}
                            onChange={e => setNewUser(prev => ({ ...prev, team: e.target.value }))}
                            disabled={!newUser.organization}
                        >
                            <option value="">팀 선택 (옵션)</option>
                            {teamOptions.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', marginLeft: 8 }}>
                        <button style={{ ...menuGhostBtn, background: '#3b82f6', color: '#fff', border: 'none', height: 38 }} type="button" onClick={createUser}>
                            <UserPlus size={14} style={{ marginRight: 6 }} /> 사용자 생성
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
