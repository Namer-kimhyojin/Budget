import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { menuStyles } from '../../shared/menuUi';

const { menuPanelCard, menuPanelBody, simpleSelect, simpleInput, menuGhostBtn } = menuStyles;

export default function ApprovalFilters({
  version,
  versionOptions,
  selectableDepartments,
  selectableTeams,
  selectedDeptId,
  selectedTeamId,
  statusFilter,
  searchText,
  canChangeDept,
  onChange,
}) {
  return (
    <section style={{ ...menuPanelCard, minHeight: 'auto' }}>
      <div style={{ ...menuPanelBody, padding: '12px 14px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            style={{ ...simpleSelect, minWidth: 210, fontWeight: 600 }}
            aria-label="예산 회차"
            value={version?.id ? String(version.id) : ''}
            onChange={(e) => onChange.handleVersionChange(e.target.value)}
          >
            {!version?.id && <option value="">회차 선택</option>}
            {versionOptions.map(v => (
              <option key={v.id} value={v.id}>
                {v.year} / {v.name || `${v.round}차`}
              </option>
            ))}
          </select>

          <select
            style={{ ...simpleSelect, minWidth: 190, fontWeight: 600 }}
            aria-label="부서"
            value={selectedDeptId || ''}
            onChange={(e) => {
              onChange.setSelectedDeptId(e.target.value);
              onChange.setSelectedTeamId('');
              onChange.setDetailDraft({});
            }}
            disabled={!canChangeDept}
          >
            <option value="">부서 선택</option>
            {selectableDepartments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
          </select>

          <select
            style={{ ...simpleSelect, minWidth: 170 }}
            aria-label="팀"
            value={selectedTeamId || ''}
            onChange={(e) => {
              onChange.setSelectedTeamId(e.target.value);
              onChange.setDetailDraft({});
            }}
            disabled={!selectedDeptId || !selectableTeams.length}
          >
            <option value="">전체 팀</option>
            {selectableTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
            {[
              { value: 'ALL', label: '전체' },
              { value: 'DRAFT', label: '작성중' },
              { value: 'PENDING', label: '제출' },
              { value: 'REVIEWING', label: '검토중' },
              { value: 'FINALIZED', label: '확정' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange.setStatusFilter(opt.value)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: statusFilter === opt.value ? '#fff' : 'transparent',
                  color: statusFilter === opt.value ? '#1e293b' : '#64748b',
                  boxShadow: statusFilter === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 8, padding: '0 10px', background: '#fff' }}>
              <Search size={14} color="#94a3b8" />
            <input
              style={{ ...simpleInput, border: 'none', minWidth: 0, width: '100%', padding: '7px 0', fontSize: 13 }}
              aria-label="검색"
              placeholder="ID / 예산항목 / 조직명 검색"
              value={searchText}
              onChange={e => onChange.setSearchText(e.target.value)}
            />
          </div>

          <button
            type="button"
            style={{ ...menuGhostBtn, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, padding: '7px 10px', color: '#64748b' }}
            onClick={onChange.resetFilters}
          >
            <RotateCcw size={13} /> 초기화
          </button>
        </div>
      </div>
    </section>
  );
}
