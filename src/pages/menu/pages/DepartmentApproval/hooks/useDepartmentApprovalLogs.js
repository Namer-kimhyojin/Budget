import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatLogDateTime, isRejectLog, toLogMarker } from '../helpers';

export function useDepartmentApprovalLogs({
  authAxios,
  scopeEntryIds,
  scopeEntries,
  filteredEntries,
  version,
}) {
  const [entryLogsById, setEntryLogsById] = useState({});
  const [newLogEntries, setNewLogEntries] = useState({});
  const hasLogBaselineRef = useRef(false);
  const logMarkersRef = useRef({});

  const resetLogsState = useCallback(() => {
    hasLogBaselineRef.current = false;
    logMarkersRef.current = {};
    setEntryLogsById({});
    setNewLogEntries({});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLogs = async () => {
      if (!scopeEntryIds.length) {
        setEntryLogsById({});
        return;
      }
      try {
        const res = await authAxios.get('/api/logs/', {
          params: {
            entry_ids: scopeEntryIds.join(','),
            year: version?.year,
            round: version?.round,
          },
        });
        const raw = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        const filtered = raw.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
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
  }, [authAxios, scopeEntryIds, version?.year, version?.round]);

  useEffect(() => {
    const currentMarkers = {};
    Object.entries(entryLogsById).forEach(([entryId, logs]) => {
      const marker = toLogMarker(logs?.[0]);
      if (marker) currentMarkers[String(entryId)] = marker;
    });
    if (!hasLogBaselineRef.current) {
      hasLogBaselineRef.current = true;
      logMarkersRef.current = currentMarkers;
      return;
    }
    const changed = {};
    Object.entries(currentMarkers).forEach(([entryId, marker]) => {
      if (!logMarkersRef.current[entryId] || logMarkersRef.current[entryId] !== marker) {
        changed[entryId] = true;
      }
    });
    if (Object.keys(changed).length) {
      queueMicrotask(() => {
        setNewLogEntries((prev) => ({ ...prev, ...changed }));
      });
    }
    logMarkersRef.current = currentMarkers;
  }, [entryLogsById]);

  const recentWorkflowLogs = useMemo(() => {
    const seen = new Set();
    const merged = [];
    Object.values(entryLogsById).forEach((logs) => {
      logs.forEach((log) => {
        const key = log.id ? `id:${log.id}` : toLogMarker(log);
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(log);
      });
    });
    merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return merged.slice(0, 12);
  }, [entryLogsById]);

  const submissionInfoById = useMemo(() => {
    const map = {};
    scopeEntries.forEach((entry) => {
      const logs = (entryLogsById[Number(entry.id)] || []);
      const submitLog = logs.find((log) => log?.to_status === 'PENDING') || null;
      const latestLog = logs[0] || null;
      const detailCount = Array.isArray(entry?.details)
        ? entry.details.length
        : Number(entry?.detail_count || 0);

      const submittedById = (
        submitLog?.actor_name
        || submitLog?.actor
        || entry?.submitted_by
        || latestLog?.actor_name
        || latestLog?.actor
        || entry?.latest_action_by
        || '-'
      );
      const submittedByDisplay = (
        submitLog?.actor_display
        || entry?.submitted_by_display
        || latestLog?.actor_display
        || entry?.latest_action_by_display
        || submittedById
      );

      map[Number(entry.id)] = {
        submittedById,
        submittedByDisplay,
        submittedAt: submitLog?.created_at || entry?.submitted_at || null,
        submittedAtLabel: formatLogDateTime(submitLog?.created_at || entry?.submitted_at),
        latestActor: (
          latestLog?.actor_display
          || latestLog?.actor_name
          || latestLog?.actor
          || entry?.latest_action_by_display
          || entry?.latest_action_by
          || '-'
        ),
        latestAtLabel: formatLogDateTime(latestLog?.created_at || entry?.latest_action_at),
        detailCount,
        detailSummaryLabel: `산출내역 ${detailCount}건`,
      };
    });
    return map;
  }, [scopeEntries, entryLogsById]);

  const groupedSubmissions = useMemo(() => {
    const groups = new Map();
    filteredEntries.forEach((entry) => {
      const entryId = Number(entry.id);
      const info = submissionInfoById[entryId] || {};
      const submitterId = String(info.submittedById || entry.submitted_by || '-');
      const submitterName = String(info.submittedByDisplay || entry.submitted_by_display || submitterId);
      const key = submitterId !== '-' ? submitterId : `entry:${entryId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          submitterId,
          submitterName,
          entries: [],
          entryIds: [],
          organizations: new Set(),
          totalAmount: 0,
          detailCount: 0,
          submittedAt: null,
          submittedAtLabel: '-',
          changeLogCount: 0,
          rejectLogCount: 0,
          hasNewLog: false,
          statusCounts: {},
        });
      }
      const group = groups.get(key);
      group.entries.push(entry);
      group.entryIds.push(entryId);
      group.organizations.add(entry.organization_name || String(entry.organization || '-'));
      group.totalAmount += Number(entry.total_amount || 0);
      group.detailCount += Number(info.detailCount || entry.detail_count || (Array.isArray(entry.details) ? entry.details.length : 0));
      group.statusCounts[entry.status || 'DRAFT'] = (group.statusCounts[entry.status || 'DRAFT'] || 0) + 1;
      if (newLogEntries[String(entryId)]) group.hasNewLog = true;

      const logs = entryLogsById[entryId] || [];
      group.changeLogCount += logs.filter((log) => !isRejectLog(log)).length;
      group.rejectLogCount += logs.filter((log) => isRejectLog(log)).length;

      const submittedAt = info.submittedAt || entry.submitted_at || null;
      const submittedTs = submittedAt ? new Date(submittedAt).getTime() : 0;
      const currentTs = group.submittedAt ? new Date(group.submittedAt).getTime() : 0;
      if (submittedTs > currentTs) {
        group.submittedAt = submittedAt;
        group.submittedAtLabel = info.submittedAtLabel || formatLogDateTime(submittedAt);
      }
    });

    return Array.from(groups.values())
      .map((group) => {
        const statuses = Object.keys(group.statusCounts);
        const status = statuses.length === 1 ? statuses[0] : 'MIXED';
        const subjectNames = group.entries.map((entry) => entry.subject_name || entry.subject_code || `#${entry.subject}`);
        const preview = subjectNames.slice(0, 2).join(', ');
        const subjectSummaryLabel = subjectNames.length > 2 ? `${preview} +${subjectNames.length - 2}` : preview;
        const organizationSummary = group.organizations.size === 1
          ? Array.from(group.organizations)[0]
          : `${group.organizations.size}개 부서`;
        return {
          ...group,
          status,
          entryCount: group.entries.length,
          subjectSummaryLabel,
          organizationSummary,
        };
      })
      .sort((a, b) => {
        const aTs = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bTs = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        if (bTs !== aTs) return bTs - aTs;
        return String(a.submitterId).localeCompare(String(b.submitterId));
      });
  }, [filteredEntries, submissionInfoById, entryLogsById, newLogEntries]);

  const clearNewLog = useCallback((entryId) => {
    const key = String(entryId);
    setNewLogEntries((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const clearNewLogsByEntryIds = useCallback((entryIds = []) => {
    setNewLogEntries((prev) => {
      let changed = false;
      const next = { ...prev };
      entryIds.forEach((entryId) => {
        const key = String(entryId);
        if (next[key]) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  return {
    entryLogsById,
    newLogEntries,
    recentWorkflowLogs,
    submissionInfoById,
    groupedSubmissions,
    clearNewLog,
    clearNewLogsByEntryIds,
    resetLogsState,
  };
}
