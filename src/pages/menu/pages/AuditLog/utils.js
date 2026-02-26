/**
 * Detect anomalies in audit logs.
 * Focus on workflow-like logs for state-transition checks.
 */
export function detectAnomalies(logs) {
  const anomalies = [];
  const rows = Array.isArray(logs) ? logs : [];

  const workflowLogs = rows.filter((l) => {
    const hasEntry = l.entry !== null && l.entry !== undefined;
    const hasStatus = Boolean(l.from_status || l.to_status);
    return (l.log_type === 'WORKFLOW') || (hasEntry && hasStatus);
  });

  const offHours = rows.filter((l) => {
    const h = new Date(l.created_at).getHours();
    return h < 8 || h >= 18;
  });
  if (offHours.length > 0) {
    anomalies.push({
      level: 'warning',
      title: '업무시간 외 활동',
      desc: `${offHours.length}건의 로그가 업무시간(08:00~18:00) 외에 기록되었습니다.`,
      logs: offHours.map((l) => l.id).filter(Boolean),
    });
  }

  const order = { DRAFT: 0, PENDING: 1, REVIEWING: 2, FINALIZED: 3 };
  const reversals = workflowLogs.filter((l) => (order[l.from_status] ?? -1) > (order[l.to_status] ?? -1));
  if (reversals.length > 0) {
    anomalies.push({
      level: 'danger',
      title: '상태 역행 감지',
      desc: `${reversals.length}건의 로그에서 상태가 되돌아갔습니다 (예: FINALIZED -> DRAFT).`,
      logs: reversals.map((l) => l.id).filter(Boolean),
    });
  }

  const byEntry = {};
  workflowLogs.forEach((l) => {
    const key = l.entry;
    if (!key) return;
    if (!byEntry[key]) byEntry[key] = [];
    byEntry[key].push(l);
  });

  const rapidLogIds = [];
  Object.values(byEntry).forEach((entryLogs) => {
    const sorted = [...entryLogs].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    for (let i = 1; i < sorted.length; i += 1) {
      const diff = (new Date(sorted[i].created_at) - new Date(sorted[i - 1].created_at)) / 1000 / 60;
      if (diff < 10) {
        if (sorted[i].id) rapidLogIds.push(sorted[i].id);
        if (sorted[i - 1].id) rapidLogIds.push(sorted[i - 1].id);
        break;
      }
    }
  });
  if (rapidLogIds.length > 0) {
    anomalies.push({
      level: 'warning',
      title: '단시간 반복 변경',
      desc: `${new Set(rapidLogIds).size}건의 로그가 10분 이내 반복 상태변경으로 감지되었습니다.`,
      logs: [...new Set(rapidLogIds)],
    });
  }

  const byActor = {};
  rows.forEach((l) => {
    const key = l.actor_name || l.actor || 'Unknown';
    byActor[key] = (byActor[key] || 0) + 1;
  });
  Object.entries(byActor).forEach(([actor, cnt]) => {
    if (cnt >= 5 && cnt / Math.max(rows.length, 1) >= 0.5) {
      anomalies.push({
        level: 'info',
        title: '처리자 집중',
        desc: `${actor}이(가) 전체 로그의 ${Math.round((cnt / Math.max(rows.length, 1)) * 100)}% (${cnt}건)를 처리했습니다.`,
        logs: [],
      });
    }
  });

  const noReasonReject = workflowLogs.filter(
    (l) => l.to_status === 'DRAFT' && l.from_status !== 'DRAFT' && !String(l.reason || '').trim(),
  );
  if (noReasonReject.length > 0) {
    anomalies.push({
      level: 'warning',
      title: '사유 없는 반려',
      desc: `${noReasonReject.length}건의 반려 처리에 사유가 없습니다.`,
      logs: noReasonReject.map((l) => l.id).filter(Boolean),
    });
  }

  return anomalies;
}
