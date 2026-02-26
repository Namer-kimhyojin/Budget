
import React from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { menuStyles, EmptyState } from '../../shared/menuUi';
import { getOrgNameById } from './orgUtils';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleInput, simpleTable, simpleTh, simpleTd, menuGhostBtn } = menuStyles;

const ROLE_LABELS = {
    ADMIN: '시스템 관리자',
    MANAGER: '총무팀',
    STAFF: '부서담당자',
    REVIEWER: '총무팀',    // 하위 호환
    REQUESTOR: '부서담당자', // 하위 호환
    ORG_VIEWER: '열람자',
};

export default function UserList({ filteredUsers, searchTerm, setSearchTerm, openEditModal, removeUser, orgs }) {
    const resolveOrganizationName = (row) => row.organization_name || getOrgNameById(orgs, row.organization);
    const resolveTeamName = (row) => row.team_name || getOrgNameById(orgs, row.team);

    return (
        <section style={{ ...menuPanelCard, padding: 0 }}>
            <div style={{ ...menuPanelHead, justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', margin: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>사용자 목록</span>
                <div style={{ position: 'relative', width: 280 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        style={{ ...simpleInput, paddingLeft: 36, width: '100%' }}
                        placeholder="이름 또는 아이디로 검색..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <div style={{ ...menuPanelBody, padding: 0 }}>
                {filteredUsers.length === 0 ? (
                    <div style={{ padding: 40 }}>
                        <EmptyState title="사용자가 없습니다" description={searchTerm ? "검색 결과가 없습니다." : "등록된 사용자가 없습니다."} />
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto', padding: '0 20px 20px 20px' }}>
                        <table style={{ ...simpleTable, tableLayout: 'fixed', minWidth: '100%', borderTop: 'none', marginTop: 16 }}>
                            <colgroup>
                                <col style={{ width: 60 }} />
                                <col style={{ width: 140 }} />
                                <col style={{ width: 140 }} />
                                <col style={{ width: 120 }} />
                                <col />
                                <col style={{ width: 140 }} />
                                <col style={{ width: 80 }} />
                                <col style={{ width: 130 }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th style={{ ...simpleTh, padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>No.</th>
                                    <th style={{ ...simpleTh, padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>아이디</th>
                                    <th style={{ ...simpleTh, padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>이름</th>
                                    <th style={{ ...simpleTh, padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>역할</th>
                                    <th style={{ ...simpleTh, padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>부서</th>
                                    <th style={{ ...simpleTh, padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>팀</th>
                                    <th style={{ ...simpleTh, textAlign: 'center', padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>상태</th>
                                    <th style={{ ...simpleTh, textAlign: 'right', padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '2px solid #e2e8f0' }}>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(row => (
                                    <tr key={row.id}>
                                        <td style={{ ...simpleTd, padding: '12px 16px', whiteSpace: 'nowrap' }}>{row.id}</td>
                                        <td style={{ ...simpleTd, padding: '12px 16px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>{row.username}</td>
                                        <td style={{ ...simpleTd, padding: '12px 16px', whiteSpace: 'nowrap' }}>{row.name || '-'}</td>
                                        <td style={{ ...simpleTd, padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <span style={{
                                                display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: '11px', fontWeight: 600,
                                                background: row.role === 'ADMIN' ? '#eff6ff' : (row.role === 'MANAGER' || row.role === 'REVIEWER') ? '#f0fdf4' : '#f8fafc',
                                                color: row.role === 'ADMIN' ? '#1d4ed8' : (row.role === 'MANAGER' || row.role === 'REVIEWER') ? '#15803d' : '#64748b',
                                                border: '1px solid', borderColor: row.role === 'ADMIN' ? '#bfdbfe' : (row.role === 'MANAGER' || row.role === 'REVIEWER') ? '#bbf7d0' : '#e2e8f0'
                                            }}>
                                                {ROLE_LABELS[row.role] || row.role}
                                            </span>
                                        </td>
                                        <td style={{ ...simpleTd, padding: '12px 16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.organization ? (resolveOrganizationName(row) || '') : ''}>
                                            {row.organization ? (resolveOrganizationName(row) || '알 수 없음') : <span style={{ color: '#cbd5e1' }}>-</span>}
                                        </td>
                                        <td style={{ ...simpleTd, padding: '12px 16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.team ? (resolveTeamName(row) || '') : ''}>
                                            {row.team ? (resolveTeamName(row) || '알 수 없음') : <span style={{ color: '#cbd5e1' }}>-</span>}
                                        </td>
                                        <td style={{ ...simpleTd, textAlign: 'center', padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            {row.is_active ?
                                                <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '11px' }}>활성</span> :
                                                <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '11px' }}>차단</span>
                                            }
                                        </td>
                                        <td style={{ ...simpleTd, padding: '12px 16px', whiteSpace: 'nowrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                                <button style={{ ...menuGhostBtn, padding: '4px 8px' }} type="button" onClick={() => openEditModal(row)}>
                                                    <Edit2 size={12} style={{ marginRight: 4 }} /> 수정
                                                </button>
                                                <button style={{ ...menuGhostBtn, color: '#ef4444', padding: '4px 8px' }} type="button" onClick={() => removeUser(row.id)}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
