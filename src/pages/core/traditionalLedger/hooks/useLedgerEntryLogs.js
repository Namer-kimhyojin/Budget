import { useEffect, useRef, useState } from 'react';

const toLogMarker = (log) => {
  if (!log) return '';
  return String(
    log.id ||
    `${log.created_at || ''}:${log.from_status || ''}:${log.to_status || ''}:${log.reason || ''}`
  );
};

export function useLedgerEntryLogs({
  authAxios,
  deptEntryIds,
  version,
  selectedScopeOrgId,
  clearNewLogEntries,
  closeLogPopover,
  setNewLogEntries,
}) {
  const [entryLogsById, setEntryLogsById] = useState({});
  const logMarkersRef = useRef({});
  const hasLogBaselineRef = useRef(false);

  useEffect(() => {
    hasLogBaselineRef.current = false;
    logMarkersRef.current = {};
    clearNewLogEntries();
    closeLogPopover();
  }, [selectedScopeOrgId, version?.id, clearNewLogEntries, closeLogPopover]);

  useEffect(() => {
    let cancelled = false;
    const loadLogs = async () => {
      if (!authAxios || !deptEntryIds.length) {
        setEntryLogsById({});
        return;
      }
      try {
        const res = await authAxios.get('/api/logs/', {
          params: {
            entry_ids: deptEntryIds.join(','),
            year: version?.year,
            round: version?.round,
          },
        });
        const raw = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        const filtered = raw
          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const map = {};
        filtered.forEach((log) => {
          const key = Number(log.entry);
          if (!map[key]) map[key] = [];
          map[key].push(log);
        });
        if (!cancelled) setEntryLogsById(map);
      } catch {
        if (!cancelled) setEntryLogsById({});
      }
    };
    loadLogs();
    return () => { cancelled = true; };
  }, [authAxios, deptEntryIds, version?.year, version?.round]);

  useEffect(() => {
    const currentMarkers = {};
    Object.entries(entryLogsById).forEach(([entryId, logs]) => {
      const marker = toLogMarker(logs[0]);
      if (marker) currentMarkers[String(entryId)] = marker;
    });

    if (!hasLogBaselineRef.current) {
      logMarkersRef.current = currentMarkers;
      hasLogBaselineRef.current = true;
      return;
    }

    const changed = {};
    Object.entries(currentMarkers).forEach(([entryId, marker]) => {
      const prevMarker = logMarkersRef.current[entryId];
      if (!prevMarker || prevMarker !== marker) {
        changed[entryId] = true;
      }
    });

    if (Object.keys(changed).length > 0) {
      setNewLogEntries((prev) => ({ ...prev, ...changed }));
    }

    logMarkersRef.current = currentMarkers;
  }, [entryLogsById, setNewLogEntries]);

  return {
    entryLogsById,
  };
}
