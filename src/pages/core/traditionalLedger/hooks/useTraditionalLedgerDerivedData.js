import { useCallback, useMemo } from "react";
import { dayDiff, formatDate, toDateOnly } from "../shared";

const VERSION_STATUS_LABEL = {
  DRAFT: "준비중",
  PENDING: "접수중",
  EXPIRED: "접수마감",
  CONFIRMED: "확정",
  CLOSED: "마감됨",
};

const STATUS_LABEL = {
  DRAFT: "작성중",
  PENDING: "제출",
  REVIEWING: "검토중",
  FINALIZED: "확정",
  MIXED: "혼합상태",
};

const VERSION_LOCK_MESSAGE =
  "현재 회차는 잠금 상태입니다. 확정되거나 마감된 회차는 편집할 수 없습니다.";
const EDIT_BLOCKED_MSG =
  "현재 상태에서는 산출내역을 추가할 수 없습니다. 부서 상태를 작성중(DRAFT)으로 되돌린 뒤 다시 시도하세요.";

export function useTraditionalLedgerDerivedData({
  orgs,
  user,
  selectedDeptId,
  selectedTeamId,
  modalDeptId,
  openHierarchyActionId,
  entries,
  version,
  projectId,
  subjects,
  hierarchySelectedGwanId,
  hierarchySelectedHangId,
  focusEntryId,
  focusEntryIds,
  localDetails,
  showCombinedTypeView,
  viewType,
  versions,
  projects,
  showMyEntries,
  hasConfirmedRound,
}) {
  const isAdminUser = user?.role === "ADMIN";

  const departments = useMemo(
    () => orgs.filter((org) => org.org_type !== "team" && !org.parent),
    [orgs],
  );
  const teams = useMemo(
    () => orgs.filter((org) => org.org_type === "team" || !!org.parent),
    [orgs],
  );

  const myOrg = useMemo(
    () => orgs.find((org) => Number(org.id) === Number(user?.organization)),
    [orgs, user?.organization],
  );
  const myDeptId = useMemo(() => {
    if (!myOrg) return null;
    if (myOrg.org_type === "team" || myOrg.parent) return Number(myOrg.parent);
    return Number(myOrg.id);
  }, [myOrg]);

  const selectableDepartments = useMemo(() => {
    if (isAdminUser) return departments;
    if (!myDeptId) return [];
    return departments.filter((dept) => Number(dept.id) === Number(myDeptId));
  }, [departments, isAdminUser, myDeptId]);

  const teamsOfDept = useMemo(
    () =>
      teams.filter((team) => Number(team.parent) === Number(selectedDeptId)),
    [teams, selectedDeptId],
  );
  const selectableTeams = useMemo(() => {
    if (isAdminUser) return teamsOfDept;
    if (!myDeptId) return [];
    if (Number(selectedDeptId) !== Number(myDeptId)) return [];
    return teamsOfDept;
  }, [isAdminUser, teamsOfDept, myDeptId, selectedDeptId]);

  const selectedScopeOrgId = selectedTeamId || selectedDeptId || null;
  const selectedScopeOrgIds = useMemo(() => {
    if (selectedTeamId) return [Number(selectedTeamId)];
    if (!selectedDeptId) return [];
    const deptId = Number(selectedDeptId);
    return [
      deptId,
      ...teams
        .filter((team) => Number(team.parent) === deptId)
        .map((team) => Number(team.id)),
    ];
  }, [selectedTeamId, selectedDeptId, teams]);

  const modalTeamsOfDept = useMemo(() => {
    if (!modalDeptId) return [];
    return teams.filter((team) => Number(team.parent) === Number(modalDeptId));
  }, [teams, modalDeptId]);
  const modalSelectableTeams = useMemo(() => {
    if (isAdminUser) return modalTeamsOfDept;
    if (!myDeptId) return [];
    if (Number(modalDeptId) !== Number(myDeptId)) return [];
    return modalTeamsOfDept;
  }, [isAdminUser, modalTeamsOfDept, myDeptId, modalDeptId]);

  const openHierarchyParentSubject = useMemo(() => {
    if (!openHierarchyActionId) return null;
    const [, rawId] = String(openHierarchyActionId).split("-");
    const subjectId = Number(rawId);
    if (!Number.isFinite(subjectId)) return null;
    return subjects.find((subject) => Number(subject.id) === subjectId) || null;
  }, [openHierarchyActionId, subjects]);

  const usedMokIdsInScope = useMemo(() => {
    if (!selectedScopeOrgId || !version?.year) return new Set();
    const used = new Set();
    entries.forEach((entry) => {
      if (Number(entry.organization) !== Number(selectedScopeOrgId)) return;
      if (Number(entry.year) !== Number(version.year)) return;
      if (Number(entry.supplemental_round ?? 0) !== Number(version.round ?? 0))
        return;
      if (Number(entry.entrusted_project || 0) !== Number(projectId || 0))
        return;
      used.add(Number(entry.subject));
    });
    return used;
  }, [entries, selectedScopeOrgId, version, projectId]);

  const leafSubjectIds = useMemo(() => {
    const parentIds = new Set(
      subjects.map((s) => Number(s.parent)).filter((p) => !isNaN(p)),
    );
    return new Set(
      subjects
        .filter((s) => !parentIds.has(Number(s.id)))
        .map((s) => Number(s.id)),
    );
  }, [subjects]);

  const hierarchyStepOptions = useMemo(() => {
    if (!openHierarchyParentSubject) {
      return { level: 0, gwanOptions: [], hangOptions: [], mokOptions: [] };
    }
    const level = Number(openHierarchyParentSubject.level || 0);
    const parentId = Number(openHierarchyParentSubject.id);
    const subjectType = openHierarchyParentSubject.subject_type;
    const filtered = subjects.filter(
      (subject) => subject.subject_type === subjectType,
    );

    const gwanOptions =
      level === 1
        ? filtered.filter(
          (subject) =>
            Number(subject.parent) === parentId &&
            Number(subject.level) === 2,
        )
        : [];
    const hangParentId =
      level === 2 ? parentId : Number(hierarchySelectedGwanId || 0);
    const hangOptions =
      level <= 2 && hangParentId
        ? filtered.filter(
          (subject) =>
            Number(subject.parent) === hangParentId &&
            Number(subject.level) === 3,
        )
        : [];
    const mokParentId =
      level === 3 ? parentId : Number(hierarchySelectedHangId || 0);
    // If we're looking for Moks, we look for Level 4 OR Level 3 if it's a leaf node.
    // However, the previous steps already filtered by level.
    // Let's use leaf node logic for mokOptions.
    const mokOptions =
      level <= 3 && mokParentId
        ? filtered.filter(
          (subject) =>
            Number(subject.parent) === mokParentId &&
            (Number(subject.level) === 4 ||
              leafSubjectIds.has(Number(subject.id))),
        )
        : [];

    return { level, gwanOptions, hangOptions, mokOptions };
  }, [
    openHierarchyParentSubject,
    subjects,
    hierarchySelectedGwanId,
    hierarchySelectedHangId,
    leafSubjectIds,
  ]);

  const pEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          Number(entry.year) === Number(version?.year) &&
          Number(entry.supplemental_round ?? 0) ===
          Number(version?.round ?? 0) &&
          (!selectedScopeOrgIds.length ||
            selectedScopeOrgIds.includes(Number(entry.organization))) &&
          (!focusEntryId || Number(entry.id) === Number(focusEntryId)) &&
          (!(Array.isArray(focusEntryIds) && focusEntryIds.length) ||
            focusEntryIds.includes(Number(entry.id))),
      ),
    [entries, selectedScopeOrgIds, version, focusEntryId, focusEntryIds],
  );

  const subjectTypeById = useMemo(() => {
    const map = {};
    subjects.forEach((subject) => {
      map[Number(subject.id)] = subject.subject_type;
    });
    return map;
  }, [subjects]);

  const calcEntryAmount = useCallback(
    (entry) => {
      const details = Array.isArray(entry?.details) ? entry.details : [];
      if (details.length > 0) {
        return details.reduce((sum, detail) => {
          const p = Number(localDetails[detail.id]?.price ?? detail.price ?? 0);
          const q = Number(localDetails[detail.id]?.qty ?? detail.qty ?? 0);
          const f = Number(localDetails[detail.id]?.freq ?? detail.freq ?? 0);
          return sum + p * q * f;
        }, 0);
      }
      return Number(entry?.total_amount || 0);
    },
    [localDetails],
  );

  const activeEntries = useMemo(() => {
    let filtered = showCombinedTypeView
      ? pEntries
      : pEntries.filter(
        (entry) => subjectTypeById[Number(entry.subject)] === viewType,
      );

    if (showMyEntries && user?.username) {
      filtered = filtered.filter((entry) => {
        // checks if user submitted or approved it, or is the latest actor
        if (
          entry.latest_action_by === user.username ||
          entry.submitted_by === user.username
        )
          return true;

        // checks if any details belong to the user
        const entryDetails = Array.isArray(entry?.details) ? entry.details : [];
        if (entryDetails.length === 0) {
          // Empty items (갓 추가되어 아직 산출내역이 없는 경우)는 숨기지 않고 표시해야 함
          return true;
        }

        return entryDetails.some(
          (d) =>
            d.author_username === user.username ||
            d.updated_by_username === user.username,
        );
      });
    }

    return filtered;
  }, [
    pEntries,
    subjectTypeById,
    viewType,
    showCombinedTypeView,
    showMyEntries,
    user,
  ]);

  const inputAvailableVersions = useMemo(
    () =>
      [...versions]
        .filter((targetVersion) => targetVersion.status === "PENDING" || targetVersion.status === "DRAFT")
        .sort((a, b) => b.year - a.year || b.round - a.round),
    [versions],
  );

  const editableEntries = useMemo(
    () =>
      activeEntries.filter((entry) => (entry.status || "DRAFT") === "DRAFT"),
    [activeEntries],
  );
  const enteredCount = useMemo(
    () =>
      editableEntries.filter((entry) => (entry.details || []).length > 0)
        .length,
    [editableEntries],
  );
  const totalEditableCount = editableEntries.length;
  const inputProgressRatio = totalEditableCount
    ? Math.round((enteredCount / totalEditableCount) * 100)
    : 0;

  const selectedVersionPeriod = useMemo(() => {
    const start = toDateOnly(version?.start_date);
    const end = toDateOnly(version?.end_date);
    const today = toDateOnly(new Date());
    if (!start && !end)
      return { periodText: "미지정", deadlineText: "입력기간 미지정" };
    if (!today)
      return {
        periodText: `${formatDate(start)} ~ ${formatDate(end)}`,
        deadlineText: "-",
      };

    const periodText = `${formatDate(start)} ~ ${formatDate(end)}`;
    if (start && today < start)
      return { periodText, deadlineText: `시작 전 D-${dayDiff(start, today)}` };
    if (end && today > end)
      return { periodText, deadlineText: `마감 +${dayDiff(today, end)}일` };
    if (end && dayDiff(end, today) === 0)
      return { periodText, deadlineText: "오늘 마감 (D-Day)" };
    if (end)
      return { periodText, deadlineText: `마감 D-${dayDiff(end, today)}` };
    return { periodText, deadlineText: "진행중" };
  }, [version?.start_date, version?.end_date]);

  const selectedDeptName = useMemo(() => {
    const target = departments.find(
      (dept) => Number(dept.id) === Number(selectedDeptId),
    );
    return target?.name || "-";
  }, [departments, selectedDeptId]);

  const { incTotal, expTotal } = useMemo(
    () =>
      pEntries.reduce(
        (acc, entry) => {
          const subjectType = subjectTypeById[Number(entry.subject)];
          if (!subjectType) return acc;
          const amount = calcEntryAmount(entry);
          if (subjectType === "income") acc.incTotal += amount;
          if (subjectType === "expense") acc.expTotal += amount;
          return acc;
        },
        { incTotal: 0, expTotal: 0 },
      ),
    [pEntries, subjectTypeById, calcEntryAmount],
  );

  const diffTotal = incTotal - expTotal;
  const maxCompare = Math.max(incTotal, expTotal, 1);
  const incRatio = (incTotal / maxCompare) * 100;
  const expRatio = (expTotal / maxCompare) * 100;
  const isBalanced = incTotal === expTotal;

  const isVersionEditable = Boolean(version && (version.status === "PENDING" || version.status === "DRAFT"));

  const deptEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (!selectedScopeOrgIds.length ||
            selectedScopeOrgIds.includes(Number(entry.organization))) &&
          Number(entry.year) === Number(version?.year) &&
          Number(entry.supplemental_round ?? 0) === Number(version?.round ?? 0),
      ),
    [entries, selectedScopeOrgIds, version],
  );

  const deptEntryIds = useMemo(
    () =>
      deptEntries
        .map((entry) => Number(entry.id))
        .filter((id) => Number.isFinite(id)),
    [deptEntries],
  );

  const deptStatus = useMemo(() => {
    if (!deptEntries.length) return "DRAFT";
    const uniq = [
      ...new Set(deptEntries.map((entry) => entry.status || "DRAFT")),
    ];
    return uniq.length === 1 ? uniq[0] : "MIXED";
  }, [deptEntries]);

  const detailToEntryId = useMemo(() => {
    const map = {};
    entries.forEach((entry) =>
      (entry.details || []).forEach((detail) => {
        map[detail.id] = entry.id;
      }),
    );
    return map;
  }, [entries]);

  const detailUpdatedAtById = useMemo(() => {
    const map = {};
    entries.forEach((entry) =>
      (entry.details || []).forEach((detail) => {
        if (detail?.updated_at) map[detail.id] = detail.updated_at;
      }),
    );
    return map;
  }, [entries]);

  const canEditEntry = useCallback(
    (entryId) => {
      if (!isVersionEditable) return false;
      const target =
        activeEntries.find((entry) => Number(entry.id) === Number(entryId)) ||
        entries.find((entry) => Number(entry.id) === Number(entryId));
      if (!target) return false;
      if (
        user?.role === "ADMIN" ||
        user?.role === "MANAGER" ||
        user?.role === "REVIEWER"
      )
        return true;
      return target.status === "DRAFT";
    },
    [isVersionEditable, activeEntries, entries, user?.role],
  );

  const tree = useMemo(() => {
    const map = {};
    activeEntries.forEach((entry) => {
      const mok = subjects.find(
        (subject) => Number(subject.id) === Number(entry.subject),
      );
      if (!mok) return;

      const amount = calcEntryAmount(entry);
      const entryWithCalc = { ...entry, total_amount_calc: amount };

      const hang = subjects.find(
        (subject) => Number(subject.id) === Number(mok.parent),
      );
      const gwan = hang
        ? subjects.find((subject) => Number(subject.id) === Number(hang.parent))
        : null;
      const jangSub = gwan
        ? subjects.find((subject) => Number(subject.id) === Number(gwan.parent))
        : null;

      const currentOrg = orgs.find(
        (org) =>
          Number(org.id) === Number(entry.organization || selectedScopeOrgId),
      );
      const entryProject = projects.find(
        (project) => Number(project.id) === Number(entry.entrusted_project),
      );

      // Group by Level 1 Subject (Jang) as primary identity for the ledger
      const jSubId = jangSub?.id ? `j-${jangSub.id}` : null;
      const pKey = entryProject ? `p-${entryProject.id}` : null;
      const oKey = currentOrg ? `org-${currentOrg.id}` : "non-project";

      // entrusted_project가 있으면 과제명을 장(사업명)으로 표시
      // entrusted_project 없으면 장 subject → 없으면 org
      const jangKey = entryProject
        ? `${jSubId || "j-none"}-${pKey}`
        : jSubId || oKey;

      const jangName = entryProject
        ? entryProject.name
        : jangSub?.name || currentOrg?.name || "본점";

      const lastYearAmount = Number(entry.last_year_amount || 0);

      if (!map[jangKey])
        map[jangKey] = {
          name: jangName,
          obj: jangSub,
          children: {},
          total: 0,
          lastTotal: 0,
        };
      const gId = gwan?.id || "none";
      if (!map[jangKey].children[gId])
        map[jangKey].children[gId] = {
          obj: gwan,
          children: {},
          total: 0,
          lastTotal: 0,
        };
      const hId = hang?.id || "none";
      if (!map[jangKey].children[gId].children[hId])
        map[jangKey].children[gId].children[hId] = {
          obj: hang,
          moks: [],
          total: 0,
          lastTotal: 0,
        };

      const existingMokIndex = map[jangKey].children[gId].children[hId].moks.findIndex(m => m.mok?.id === mok.id);
      if (existingMokIndex >= 0) {
        map[jangKey].children[gId].children[hId].moks[existingMokIndex].entries.push(entryWithCalc);
      } else {
        map[jangKey].children[gId].children[hId].moks.push({
          mok,
          entries: [entryWithCalc],
        });
      }
      map[jangKey].total += amount;
      map[jangKey].lastTotal += lastYearAmount;
      map[jangKey].children[gId].total += amount;
      map[jangKey].children[gId].lastTotal += lastYearAmount;
      map[jangKey].children[gId].children[hId].total += amount;
      map[jangKey].children[gId].children[hId].lastTotal += lastYearAmount;
    });
    return map;
  }, [
    activeEntries,
    subjects,
    projects,
    selectedScopeOrgId,
    orgs,
    calcEntryAmount,
  ]);

  // Return dummy data if round hasn't been confirmed yet
  if (!hasConfirmedRound) {
    return {
      isAdminUser,
      departments,
      teams,
      myOrg,
      myDeptId,
      selectableDepartments,
      teamsOfDept,
      selectableTeams,
      selectedScopeOrgId,
      selectedScopeOrgIds,
      modalTeamsOfDept,
      modalSelectableTeams,
      openHierarchyParentSubject: null,
      usedMokIdsInScope: new Set(),
      leafSubjectIds: new Set(),
      hierarchyStepOptions: {
        level: 0,
        gwanOptions: [],
        hangOptions: [],
        mokOptions: [],
      },
      pEntries: [],
      subjectTypeById: {},
      calcEntryAmount: () => 0,
      activeEntries: [],
      inputAvailableVersions,
      editableEntries: [],
      enteredCount: 0,
      totalEditableCount: 0,
      inputProgressRatio: 0,
      selectedVersionPeriod: { periodText: "-", deadlineText: "-" },
      selectedDeptName: "로딩중...",
      incTotal: 0,
      expTotal: 0,
      diffTotal: 0,
      maxCompare: 1,
      incRatio: 0,
      expRatio: 0,
      isBalanced: true,
      isVersionEditable: false,
      versionStatusLabel: VERSION_STATUS_LABEL,
      versionLockMessage: VERSION_LOCK_MESSAGE,
      EDIT_BLOCKED_MSG,
      statusLabel: STATUS_LABEL,
      deptEntries: [],
      deptEntryIds: [],
      deptStatus: "DRAFT",
      detailToEntryId: {},
      detailUpdatedAtById: {},
      canEditEntry: () => false,
      tree: {
        "dummy-jang": {
          name: "가상 사업명 (안내용)",
          obj: { id: 'd-1', sort_order: 1 },
          total: 50000000,
          lastTotal: 0,
          children: {
            "dummy-gwan": {
              obj: { id: 'd-2', name: "가상 관 항목", sort_order: 1 },
              total: 50000000,
              lastTotal: 0,
              children: {
                "dummy-hang": {
                  obj: { id: 'd-3', name: "가상 항 항목", sort_order: 1 },
                  total: 50000000,
                  lastTotal: 0,
                  moks: [
                    {
                      mok: { id: 'd-4', name: "가상 예산과목(목)", sort_order: 1 },
                      entries: [
                        {
                          id: 'd-entry-1',
                          total_amount_calc: 50000000,
                          last_year_amount: 0,
                          subject: 'dummy-mok',
                          status: 'FINALIZED',
                          details: [
                            {
                              id: 'd-detail-1',
                              name: '안내를 위한 가상 산출내역입니다',
                              price: 1000000,
                              qty: 5,
                              freq: 10,
                              unit: '식',
                              currency_unit: '원',
                              freq_unit: '회'
                            }
                          ]
                        }
                      ]
                    }
                  ],
                },
              },
            },
          },
        },
      },
    };
  }

  return {
    isAdminUser,
    departments,
    teams,
    myOrg,
    myDeptId,
    selectableDepartments,
    teamsOfDept,
    selectableTeams,
    selectedScopeOrgId,
    selectedScopeOrgIds,
    modalTeamsOfDept,
    modalSelectableTeams,
    openHierarchyParentSubject,
    usedMokIdsInScope,
    leafSubjectIds,
    hierarchyStepOptions,
    pEntries,
    subjectTypeById,
    calcEntryAmount,
    activeEntries,
    inputAvailableVersions,
    editableEntries,
    enteredCount,
    totalEditableCount,
    inputProgressRatio,
    selectedVersionPeriod,
    selectedDeptName,
    incTotal,
    expTotal,
    diffTotal,
    maxCompare,
    incRatio,
    expRatio,
    isBalanced,
    isVersionEditable,
    versionStatusLabel: VERSION_STATUS_LABEL,
    versionLockMessage: VERSION_LOCK_MESSAGE,
    EDIT_BLOCKED_MSG,
    statusLabel: STATUS_LABEL,
    deptEntries,
    deptEntryIds,
    deptStatus,
    detailToEntryId,
    detailUpdatedAtById,
    canEditEntry,
    tree,
  };
}
