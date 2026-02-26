import { useCallback, useMemo } from 'react';

export function useLedgerLogPanel({
  entryLogsById,
  setNewLogEntries,
  modalApi,
  statusLabel,
  formatLogDateTime,
  isRejectLog,
  openLogEntry,
  entries,
}) {
  const clearEntryLogHighlight = useCallback((entryId) => {
    const key = String(entryId);
    setNewLogEntries((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [setNewLogEntries]);

  const openEntryHistoryLog = useCallback(async (entry, mode = 'change') => {
    const allLogs = entryLogsById[Number(entry.id)] || [];
    const logs = mode === 'reject'
      ? allLogs.filter(log => isRejectLog(log))
      : allLogs.filter(log => !isRejectLog(log));
    if (!logs.length) return;

    const lines = logs.slice(0, 12).map((log, idx) => {
      const actor = log.actor_name || log.actor || '시스템';
      const from = statusLabel[log.from_status] || log.from_status || '-';
      const to = statusLabel[log.to_status] || log.to_status || '-';
      const reason = String(log.reason || '').trim();
      const base = `${idx + 1}. ${formatLogDateTime(log.created_at)} | ${actor} | ${from} -> ${to}`;
      return reason ? `${base} | ${reason}` : base;
    });
    const moreLine = logs.length > 12 ? `\n... 총 ${logs.length}건` : '';
    const title = entry.subject_name || entry.subject_code || entry.id;
    const heading = mode === 'reject' ? '반려 의견 로그' : '변경 로그';
    const message = `[${title}] ${heading}\n\n${lines.join('\n')}${moreLine}`;

    if (modalApi?.alert) {
      await modalApi.alert(message);
    } else {
      alert(message);
    }
    clearEntryLogHighlight(entry.id);
  }, [entryLogsById, isRejectLog, statusLabel, formatLogDateTime, modalApi, clearEntryLogHighlight]);

  const openLogGroupItems = useMemo(() => {
    if (!openLogEntry?.groupKey || !openLogEntry?.entryIds) return null;
    const result = [];
    openLogEntry.entryIds.forEach(eid => {
      const allLogs = entryLogsById[Number(eid)] || [];
      const logs = openLogEntry.mode === 'reject'
        ? allLogs.filter(log => isRejectLog(log))
        : allLogs.filter(log => !isRejectLog(log));
      if (!logs.length) return;
      const entry = entries.find(e => Number(e.id) === Number(eid));
      const subjectName = entry?.subject_name || entry?.subject_code || `항목 ${eid}`;
      result.push({ entryId: eid, subjectName, logs });
    });
    result.sort((a, b) => {
      const aTime = a.logs[0]?.created_at ? new Date(a.logs[0].created_at).getTime() : 0;
      const bTime = b.logs[0]?.created_at ? new Date(b.logs[0].created_at).getTime() : 0;
      return bTime - aTime;
    });
    return result;
  }, [openLogEntry, entryLogsById, entries, isRejectLog]);

  const openLogEntryLogs = useMemo(() => {
    if (openLogEntry?.groupKey) {
      if (!openLogEntry?.entryIds) return [];
      const allLogs = [];
      openLogEntry.entryIds.forEach(eid => {
        const logs = entryLogsById[Number(eid)] || [];
        const filtered = openLogEntry.mode === 'reject'
          ? logs.filter(log => isRejectLog(log))
          : logs.filter(log => !isRejectLog(log));
        filtered.forEach(log => {
          const entry = entries.find(e => Number(e.id) === Number(eid));
          allLogs.push({ ...log, _subjectName: entry?.subject_name || entry?.subject_code || `항목 ${eid}` });
        });
      });
      allLogs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return allLogs;
    }
    if (!openLogEntry?.id) return [];
    const logs = entryLogsById[Number(openLogEntry.id)] || [];
    return openLogEntry.mode === 'reject'
      ? logs.filter(log => isRejectLog(log))
      : logs.filter(log => !isRejectLog(log));
  }, [openLogEntry, entryLogsById, entries, isRejectLog]);

  const openLogEntryRecent = useMemo(
    () => openLogEntryLogs.slice(0, 5),
    [openLogEntryLogs]
  );

  return {
    clearEntryLogHighlight,
    openEntryHistoryLog,
    openLogGroupItems,
    openLogEntryLogs,
    openLogEntryRecent,
  };
}
