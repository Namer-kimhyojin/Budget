import React, { useMemo } from 'react';
import { MenuShell, menuStyles } from '../shared/menuUi';
import { apiErrorMessage } from '../shared/utils';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleTable, simpleTh, simpleTd } = menuStyles;

export default function ClosingStatusPage({ menuId, authAxios, version, orgs, entries, user, onBootstrap, onRefreshEntries, modalApi }) {
  const departments = useMemo(() => orgs.filter(o => o.org_type !== 'team' && !o.parent), [orgs]);
  const rows = useMemo(() => departments.map(dept => {
    const teamIds = orgs.filter(org => Number(org.parent) === Number(dept.id)).map(org => Number(org.id));
    const scopeIds = [Number(dept.id), ...teamIds];
    const scoped = entries.filter(entry => scopeIds.includes(Number(entry.organization)));
    const total = scoped.length;
    const finalized = scoped.filter(entry => entry.status === 'FINALIZED').length;
    return { dept, total, finalized, ratio: total ? Math.round((finalized / total) * 100) : 0 };
  }), [departments, orgs, entries]);

  const total = entries.length;
  const finalized = entries.filter(entry => entry.status === 'FINALIZED').length;
  const canConfirm = total > 0 && total === finalized && user?.role === 'ADMIN';

  const confirmVersion = async () => {
    if (!version) return;
    const ok = await modalApi.confirm('현재 회차를 확정(마감) 처리하시겠습니까?');
    if (!ok) return;
    try {
      await authAxios.patch(`/api/versions/${version.id}/`, { status: 'CONFIRMED', confirmed_at: new Date().toISOString() });
      await onBootstrap();
      await onRefreshEntries();
      await modalApi.alert('회차가 CONFIRMED 상태로 전환되었습니다.');
    } catch (e) {
      await modalApi.alert(apiErrorMessage(e, '회차 마감 처리에 실패했습니다.'));
    }
  };

  return (
    <MenuShell
      menuId={menuId}
      user={user}
      actions={[{ label: '회차 마감 처리', onClick: confirmVersion, disabled: !canConfirm }]}
      stats={[
        { label: '현재 회차', value: version ? `${version.year} ${version.name}` : '미선택' },
        { label: '확정 진행률', value: total ? `${Math.round((finalized / total) * 100)}%` : '0%' },
        { label: '확정/전체', value: `${finalized}/${total}` },
        { label: '마감 가능', value: canConfirm ? '예' : '아니오' },
      ]}
    >
      <section style={menuPanelCard}>
        <div style={menuPanelHead}>부서별 마감 현황</div>
        <div style={menuPanelBody}>
          <table style={simpleTable}>
            <thead><tr><th style={simpleTh}>부서</th><th style={simpleTh}>확정/전체</th><th style={simpleTh}>진행률</th></tr></thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.dept.id}>
                  <td style={simpleTd}>{row.dept.name}</td>
                  <td style={simpleTd}>{row.finalized}/{row.total}</td>
                  <td style={simpleTd}>{row.ratio}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </MenuShell>
  );
}
