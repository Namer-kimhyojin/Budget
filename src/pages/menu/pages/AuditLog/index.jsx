import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MenuShell } from '../../shared/menuUi.jsx';
import { apiErrorMessage, toList, formatDatetime } from '../../shared/utils';
import { STATUS_KO } from './constants';
import { detectAnomalies } from './utils';

import AnomalyPanel from './components/AnomalyPanel';
import LogFilter from './components/LogFilter';
import LogTable from './components/LogTable';

function normalizeNextUrl(nextUrl) {
  if (!nextUrl) return null;
  try {
    const parsed = new URL(nextUrl);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return nextUrl;
  }
}

export default function AuditLogPage({ menuId, authAxios, user, modalApi }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [entryFilter, setEntryFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [highlighted, setHighlighted] = useState(null);

  const loadLogs = useCallback(async ({ append = false, url = null } = {}) => {
    setLoading(true);
    try {
      const params = append
        ? undefined
        : {
            q: keyword || undefined,
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
            status: statusFilter || undefined,
            log_type: logTypeFilter || undefined,
            action: actionFilter || undefined,
            actor: actorFilter || undefined,
            entry: entryFilter || undefined,
          };
      const targetUrl = append ? (url || '/api/logs/') : '/api/logs/';
      const res = await authAxios.get(targetUrl, params ? { params } : undefined);
      const data = res.data;
      const pageLogs = toList(data);

      if (append) {
        setLogs((prev) => [...prev, ...pageLogs]);
      } else {
        setLogs(pageLogs);
      }
      setNextUrl(normalizeNextUrl(data?.next));
      setTotalCount(Number(data?.count || pageLogs.length || 0));
    } catch (e) {
      await modalApi.alert(apiErrorMessage(e, '감사로그 조회에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [
    actionFilter,
    actorFilter,
    authAxios,
    entryFilter,
    fromDate,
    keyword,
    logTypeFilter,
    modalApi,
    statusFilter,
    toDate,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLogs({ append: false });
    }, 250);
    return () => clearTimeout(timer);
  }, [loadLogs]);

  const filtered = logs;

  const anomalies = useMemo(() => detectAnomalies(logs), [logs]);

  const resetFilters = () => {
    setKeyword('');
    setStatusFilter('');
    setLogTypeFilter('');
    setActionFilter('');
    setActorFilter('');
    setEntryFilter('');
    setFromDate('');
    setToDate('');
    setHighlighted(null);
  };

  const exportLogs = async () => {
    if (filtered.length === 0) {
      await modalApi.alert('내보낼 로그가 없습니다. 검색 조건을 확인해주세요.');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const rows = filtered.map((l) => ({
        일시: formatDatetime(l.created_at),
        로그구분: l.log_type || '-',
        액션: l.action || '-',
        엔트리ID: l.entry || '-',
        리소스: l.resource_type || '-',
        리소스ID: l.resource_id || '-',
        이전상태: STATUS_KO[l.from_status] || l.from_status || '-',
        변경상태: STATUS_KO[l.to_status] || l.to_status || '-',
        처리자: l.actor_display || l.actor_name || l.actor || '-',
        결과코드: l.status_code || '-',
        사유: l.reason || '-',
        경로: l.path || '-',
      }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '감사로그');
      XLSX.writeFile(wb, `audit_logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
      await modalApi.alert('Excel 파일이 저장되었습니다.');
    } catch (e) {
      await modalApi.alert(apiErrorMessage(e, '내보내기에 실패했습니다.'));
    }
  };

  return (
    <MenuShell
      menuId={menuId}
      user={user}
      actions={[
        { label: '새로고침', onClick: loadLogs, disabled: loading },
        ...(nextUrl ? [{ label: '더 불러오기', onClick: () => loadLogs({ append: true, url: nextUrl }), disabled: loading }] : []),
        { label: 'Excel 내보내기', onClick: exportLogs, disabled: filtered.length === 0 },
      ]}
      stats={[
        { label: '전체 로그', value: `${totalCount}건` },
        { label: '검색 결과', value: `${filtered.length}건` },
        { label: '이상징후', value: `${anomalies.length}건` },
        { label: '로그 구분', value: logTypeFilter || '전체' },
        { label: '조회 기간', value: fromDate && toDate ? `${fromDate} ~ ${toDate}` : '전체' },
      ]}
    >
      <AnomalyPanel anomalies={anomalies} highlighted={highlighted} setHighlighted={setHighlighted} />

      <LogFilter
        keyword={keyword}
        setKeyword={setKeyword}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        logTypeFilter={logTypeFilter}
        setLogTypeFilter={setLogTypeFilter}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        actorFilter={actorFilter}
        setActorFilter={setActorFilter}
        entryFilter={entryFilter}
        setEntryFilter={setEntryFilter}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        resetFilters={resetFilters}
      />

      <LogTable logs={filtered} loading={loading} highlighted={highlighted} />
    </MenuShell>
  );
}
