import React, { useMemo, useState } from 'react';
import { ENTRY_STATUS_LABELS } from '../config';
import { MenuShell, menuStyles, InfoBox, EmptyState } from '../shared/menuUi';

const { menuPanelCard, menuPanelHead, menuPanelBody, simpleLabel, simpleSelect } = menuStyles;

export default function ReportsPage({ menuId, version, versions = [], setVersion, entries = [], orgs = [], user, modalApi }) {
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [includeStatusSheet, setIncludeStatusSheet] = useState(true);

  const versionOptions = useMemo(
    () => [...versions].sort((a, b) => b.year - a.year || b.round - a.round),
    [versions]
  );

  const allOrgs = useMemo(() => {
    const seen = new Set();
    return orgs.filter((org) => {
      if (seen.has(org.id)) return false;
      seen.add(org.id);
      return true;
    });
  }, [orgs]);

  const filteredEntries = useMemo(() => {
    if (!selectedOrgId) return entries;
    return entries.filter(entry => Number(entry.organization) === Number(selectedOrgId));
  }, [entries, selectedOrgId]);

  const summaryStats = useMemo(() => {
    const statusCounts = { DRAFT: 0, PENDING: 0, REVIEWING: 0, FINALIZED: 0 };
    let totalAmount = 0;
    filteredEntries.forEach((entry) => {
      if (statusCounts[entry.status] != null) statusCounts[entry.status] += 1;
      totalAmount += Number(entry.total_amount || 0);
    });
    return { statusCounts, totalAmount };
  }, [filteredEntries]);

  const handleVersionChange = (versionId) => {
    if (!setVersion) return;
    const next = versionOptions.find(v => String(v.id) === String(versionId));
    if (!next) return;
    setVersion(next);
  };

  const exportExcel = async () => {
    if (!version) {
      await modalApi.alert('No budget version is selected.');
      return;
    }
    if (!filteredEntries.length) {
      await modalApi.alert('No data to export for current filter.');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const now = new Date();
      const selectedOrgName = selectedOrgId
        ? (orgs.find(org => Number(org.id) === Number(selectedOrgId))?.name || selectedOrgId)
        : 'All';

      const metaRows = [
        { item: 'GeneratedAt', value: now.toLocaleString() },
        { item: 'GeneratedBy', value: user?.username || '-' },
        { item: 'BudgetVersion', value: `${version.year} ${version.name}` },
        { item: 'Organization', value: selectedOrgName },
        { item: 'Rows', value: filteredEntries.length },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metaRows), 'Meta');

      const detailRows = filteredEntries.map((entry, idx) => ({
        no: idx + 1,
        year: entry.year,
        round: entry.supplemental_round,
        organization: entry.organization_name || entry.organization,
        project: entry.entrusted_project_name || '-',
        subject_code: entry.subject_code || '',
        subject_name: entry.subject_name || entry.subject,
        status: ENTRY_STATUS_LABELS[entry.status] || entry.status,
        amount: Number(entry.total_amount || 0),
        executed: Number(entry.executed_total || 0),
        remaining: Number(entry.remaining_amount || 0),
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detailRows), 'Details');

      const summaryRows = Object.entries(summaryStats.statusCounts).map(([status, count]) => ({
        status,
        label: ENTRY_STATUS_LABELS[status] || status,
        count,
      }));
      summaryRows.push({ status: 'TOTAL', label: 'Total', count: filteredEntries.length });
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

      if (includeStatusSheet) {
        const byOrg = {};
        filteredEntries.forEach((entry) => {
          const key = entry.organization_name || String(entry.organization);
          if (!byOrg[key]) byOrg[key] = { organization: key, count: 0, amount: 0 };
          byOrg[key].count += 1;
          byOrg[key].amount += Number(entry.total_amount || 0);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.values(byOrg)), 'ByOrg');
      }

      const fileName = `budget_report_${version.year}_r${version.round}_${now.toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
      await modalApi.alert('Excel export completed.');
    } catch {
      await modalApi.alert('Failed to export Excel.');
    }
  };

  return (
    <MenuShell
      menuId={menuId}
      user={user}
      actions={[{ label: 'Excel Export', onClick: exportExcel }]}
      stats={[
        { label: 'Rows', value: `${filteredEntries.length}` },
        { label: 'Total Amount', value: `${Math.round(summaryStats.totalAmount)}` },
        { label: 'Version', value: version ? `${version.year} ${version.name}` : '-' },
      ]}
    >
      {!version && (
        <InfoBox
          type="warning"
          title="No Version Selected"
          message="Select a budget version to view/export reports."
        />
      )}

      {version && filteredEntries.length === 0 && (
        <EmptyState
          icon="📄"
          title="No Data"
          message="No rows match the current filters."
        />
      )}

      <section style={{ ...menuPanelCard, borderTop: '4px solid #2196F3', backgroundColor: '#f3f6ff' }}>
        <div style={menuPanelHead}>Report Filters</div>
        <div style={menuPanelBody}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ ...simpleLabel, display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Budget Version</label>
            <select style={simpleSelect} value={version?.id ? String(version.id) : ''} onChange={e => handleVersionChange(e.target.value)}>
              {!version?.id && <option value="">Select Version</option>}
              {versionOptions.map(v => (
                <option key={v.id} value={v.id}>
                  {v.year} / {v.name || `Round ${v.round}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ ...simpleLabel, display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Organization</label>
            <select style={simpleSelect} value={selectedOrgId} onChange={e => setSelectedOrgId(e.target.value)}>
              <option value="">All Organizations</option>
              {allOrgs.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="checkbox" checked={includeStatusSheet} onChange={e => setIncludeStatusSheet(e.target.checked)} />
              <span>Include ByOrg sheet</span>
            </label>
          </div>
        </div>
      </section>

      <section style={menuPanelCard}>
        <div style={menuPanelHead}>Preview</div>
        <div style={menuPanelBody}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            <MetricCard label="DRAFT" value={summaryStats.statusCounts.DRAFT} bg="#ffebee" color="#c62828" />
            <MetricCard label="PENDING" value={summaryStats.statusCounts.PENDING} bg="#fff3e0" color="#e65100" />
            <MetricCard label="REVIEWING" value={summaryStats.statusCounts.REVIEWING} bg="#e3f2fd" color="#0d47a1" />
            <MetricCard label="FINALIZED" value={summaryStats.statusCounts.FINALIZED} bg="#e8f5e9" color="#1b5e20" />
          </div>
        </div>
      </section>
    </MenuShell>
  );
}

function MetricCard({ label, value, bg, color }) {
  return (
    <div style={{ padding: 12, backgroundColor: bg, borderRadius: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 11, color, marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
