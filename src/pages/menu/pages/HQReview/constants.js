
export const HQ_REVIEW_STRINGS = {
    // Tabs
    tabApproval: '승인 및 확정',
    tabReports: '보고서 및 출력',

    // Stats
    reviewing: '총무팀 검토중',
    finalized: '확정됨',
    totalEntries: '전체 건수',
    rows: '내역 수',
    totalAmount: '합계 금액',
    version: '회차',

    // Actions
    approveSelected: '선택 부서 승인',
    approveAll: '전체 부서 일괄 승인',
    reopenSelected: '선택 부서 재오픈',
    exportReport: '보고서 출력',
    finalClose: '최종 회차 마감',

    // Admin Section
    adminControls: '관리자 컨트롤',
    exportPrefix: '출력: ',
    allDepartments: '전체 부서',
    deptProgress: '부서별 진행 현황',
    reviewFinalizeItems: '검토/확정 내역',
    department: '부서',
    amount: '금액',
    noDepartments: '부서 정보 없음',
    noDeptSummary: '부서별 요약 정보가 없습니다.',
    permissionTitle: '권한 안내',
    adminOnlyNotice: '총무팀(REVIEWER) 또는 관리자(ADMIN)만 확정/재오픈 처리가 가능합니다.',
    selectVersion: '회차 선택',
    budgetVersion: '예산 회차',
    subject: '예산항목',
    status: '상태',

    // ReportsTab
    reportFilters: '보고서 검색 조건',
    organization: '조직(부서/팀)',
    allOrganizations: '전체 조직',
    includeByOrg: '부서별 시트 포함',
    preview: '미리보기',
    noData: '데이터 없음',
    noMatchFilters: '현재 조건에 맞는 데이터가 없습니다.',
    selectVersionToView: '회차를 선택하여 보고서를 확인하거나 출력하세요.',

    // Status Labels for metric cards
    statusDraft: '준비중',
    statusPending: '제출대기',
    statusReviewing: '검토중',
    statusFinalized: '확정',

    // Labels
    summary: '요약',
    details: '상세',
    byDept: '부서별',

    // Messages & Alerts
    selectDeptMsg: '먼저 부서를 선택해주세요.',
    approveAction: '승인/확정',
    reopenAction: '재오픈',
    confirmWorkflow: (label, count) => `${count}개 부서에 대해 '${label}' 처리를 실행하시겠습니까?`,
    reasonLabel: '사유 (선택사항)',
    defaultReopenReason: '재오픈 요청됨',
    processSuccess: (count) => `${count}개 부서 처리가 완료되었습니다.`,
    processFail: '워크플로우 처리 중 오류가 발생했습니다.',

    confirmFinalClose: (count) => count > 0
        ? `${count}개 항목이 아직 확정되지 않았습니다. 그래도 최종 마감하시겠습니까?`
        : '모든 항목이 확정되었습니다. 이 예산 회차를 최종 마감하시겠습니까?',
    versionClosed: '예산 회차가 마감되었습니다.',
    finalCloseFail: '최종 마감 처리 중 오류가 발생했습니다.',

    noVersionSelected: '선택된 회차가 없습니다.',
    noDataToExport: '출력할 데이터가 없습니다.',
    downloadComplete: (type) => `다운로드 완료: ${type}`,
    exportFail: '엑셀 출력 중 오류가 발생했습니다.',

    // Excel Export Labels
    excelAll: '전체',
    excelTotal: '합계',
    excelReport: '보고서',
    excelMeta: '기본정보',
    excelDetails: '상세내역',
    excelSummary: '요약',
    excelByOrg: '부서별',
    excelGeneratedAt: '출력일시',
    excelGeneratedBy: '출력자',
    excelBudgetVersion: '예산 회차',
    excelOrganization: '조직',
    excelRows: '건수',
};
