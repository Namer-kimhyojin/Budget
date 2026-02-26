export const ORGANIZATIONS = [
    { id: 'MGMT', name: '경영지원실', type: 'dept' },
    { id: 'STRT', name: '전략사업본부', type: 'dept' },
    { id: 'ENER', name: '에너지사업본부', type: 'dept' },
    { id: 'BIO', name: '바이오사업본부', type: 'dept' },
    { id: 'DIGT', name: '경북디지털혁신본부', type: 'dept' },
    { id: 'AUDT', name: '감사팀', type: 'dept' },
];

export const BUDGET_SUBJECTS = [
    { id: '1000', code: '1000', name: '사업수입', level: 1, type: 'income' },
    { id: '1100', code: '1100', name: '재단운영수입', level: 2, parent: '1000', type: 'income' },
    { id: '1110', code: '1110', name: '이월금(전기)', level: 3, parent: '1100', type: 'income' },
    { id: '1111', code: '1111', name: '이월금', level: 4, parent: '1110', type: 'income' },
    { id: '1120', code: '1120', name: '임대료', level: 3, parent: '1100', type: 'income' },
    { id: '1121', code: '1121', name: '보증금', level: 4, parent: '1120', type: 'income' },

    { id: '1200', code: '1200', name: '수익사업수입', level: 2, parent: '1000', type: 'income' },
    { id: '1210', code: '1210', name: '수익사업수입', level: 3, parent: '1200', type: 'income' },
    { id: '1211', code: '1211', name: '임대료수입', level: 4, parent: '1210', type: 'income' },
    { id: '1212', code: '1212', name: '관리비수입', level: 4, parent: '1210', type: 'income' },
    { id: '1213', code: '1213', name: '이자수입', level: 4, parent: '1210', type: 'income' },

    { id: '1300', code: '1300', name: '목적사업수입', level: 2, parent: '1000', type: 'income' },
    { id: '1310', code: '1310', name: '정부보조금', level: 3, parent: '1300', type: 'income' },

    { id: '2000', code: '2000', name: '사업지출', level: 1, type: 'expense' },
    { id: '2100', code: '2100', name: '재단운영비지출', level: 2, parent: '2000', type: 'expense' },
    { id: '2111', code: '2111', name: '인건비', level: 3, parent: '2100', type: 'expense' },
    { id: '2112', code: '2112', name: '기본급', level: 4, parent: '2111', type: 'expense' },
    { id: '2113', code: '2113', name: '제수당', level: 4, parent: '2111', type: 'expense' },
    { id: '2114', code: '2114', name: '인건부담금(보험)', level: 4, parent: '2111', type: 'expense' },

    { id: '2200', code: '2200', name: '목적사업비', level: 2, parent: '2000', type: 'expense' },
    { id: '2210', code: '2210', name: '거점기능강화사업', level: 3, parent: '2200', type: 'expense' },
    { id: '2211', code: '2211', name: '직접사업비', level: 4, parent: '2210', type: 'expense' },

    { id: '2300', code: '2300', name: '자기자본사업지출', level: 2, parent: '2000', type: 'expense' },
    { id: '2310', code: '2310', name: '자기자본사업비', level: 3, parent: '2300', type: 'expense' },
    { id: '2311', code: '2311', name: '직접사업비', level: 4, parent: '2310', type: 'expense' },

    { id: '2400', code: '2400', name: '수익사업지출', level: 2, parent: '2000', type: 'expense' },
    { id: '2410', code: '2410', name: 'KOLAS운영비', level: 3, parent: '2400', type: 'expense' },
    { id: '2411', code: '2411', name: '직접사업비', level: 4, parent: '2410', type: 'expense' },
    { id: '2420', code: '2420', name: '단지운영비', level: 3, parent: '2400', type: 'expense' },
    { id: '2421', code: '2421', name: '단지관리비', level: 4, parent: '2420', type: 'expense' },
];

export const BUDGET_ENTRIES = [
    // ... 수입 항목 생략 (이전 유지)
    {
        id: 'e_labor_base',
        subjectId: '2112', // 기본급
        year: 2026,
        amount: 1004252000,
        lastYearAmount: 950000000,
        details: [
            { name: '기본급 (전략사업본부)', price: 1004252000, qty: 1, unit: '식', freq: 1, source: '자체', orgId: 'STRT', subLabel: '20명' },
        ]
    },
    {
        id: 'e_allowance',
        subjectId: '2113', // 제수당
        year: 2026,
        amount: 181345500,
        lastYearAmount: 175000000,
        details: [
            { name: '직책수당(부서장)', price: 700000, qty: 1, unit: '명', freq: 12, source: '자체', orgId: 'STRT', subLabel: '월' },
            { name: '직책수당(팀장)', price: 500000, qty: 5, unit: '명', freq: 12, source: '자체', orgId: 'STRT', subLabel: '월' },
            { name: '가족수당', price: 78920, qty: 10, unit: '명', freq: 12, source: '자체', orgId: 'STRT', subLabel: '월' },
            { name: '맞춤형복지', price: 1086250, qty: 20, unit: '명', freq: 1, source: '자체', orgId: 'STRT', subLabel: '연' },
        ]
    },
    {
        id: 'e_insure',
        subjectId: '2114', // 인건부담금(보험)
        year: 2026,
        amount: 132616216,
        lastYearAmount: 128000000,
        details: [
            { name: '국민연금', price: 1072930, qty: 0.045, unit: '%', freq: 12, source: '자체', orgId: 'STRT', is_rate: true, subLabel: '12월' },
            { name: '건강보험', price: 1072930, qty: 0.04, unit: '%', freq: 12, source: '자체', orgId: 'STRT', is_rate: true, subLabel: '12월' },
        ]
    },
    {
        id: 'e_project_1',
        subjectId: '2211', // 거점기능강화 직접사업비
        year: 2026,
        amount: 850000000,
        lastYearAmount: 840000000,
        details: [
            { name: '참여인력 인건비', price: 1604000, qty: 20, unit: '명', freq: 12, source: '시비', orgId: 'STRT', subLabel: '월' },
            { name: '국외여비', price: 6250000, qty: 2, unit: '명', freq: 1, source: '시비', orgId: 'STRT', subLabel: '회' },
            { name: '전문가활용비', price: 250000, qty: 15, unit: '명', freq: 20, source: '시비', orgId: 'STRT', subLabel: '회' },
        ]
    },
    {
        id: 'e_self_capital',
        subjectId: '2311', // 자기자본 직접사업비
        year: 2026,
        amount: 500000,
        lastYearAmount: 0,
        details: [
            { name: '에너지 첨단산업 벤처펀드 (펀드조성출자금)', price: 500000000, qty: 1, unit: '식', freq: 1, source: '자체', orgId: 'STRT' },
        ]
    },
    {
        id: 'e_profit_kolas',
        subjectId: '2411', // KOLAS 상업 직접사업비
        year: 2026,
        amount: 60000,
        lastYearAmount: 0,
        details: [
            { name: '비품 및 장비(소모품) 구입비 (자산취득비)', price: 30000000, qty: 1, unit: '회', freq: 1, source: '자체', orgId: 'MGMT' },
            { name: '장비, 전기·가스 등의 유지보수비 (수선유지비)', price: 20000000, qty: 1, unit: '회', freq: 1, source: '자체', orgId: 'MGMT' },
            { name: '전기·가스 등의 사용료 (사업관리비)', price: 5000000, qty: 1, unit: '회', freq: 1, source: '자체', orgId: 'MGMT' },
            { name: '국제 및 국가 표준, 성적서 특수용지 구매 등 (도서인쇄비)', price: 5000000, qty: 1, unit: '회', freq: 1, source: '자체', orgId: 'MGMT' },
        ]
    },
    {
        id: 'e_profit_complex',
        subjectId: '2421', // 단지관리비
        year: 2026,
        amount: 18040,
        lastYearAmount: 18040,
        details: [
            { name: '연구장비 수리비 (수선유지비)', price: 1000000, qty: 10, unit: '회', freq: 1, source: '자체', orgId: 'MGMT' },
            { name: '특수근무자 신체검사비 (환경안전보건관리비)', price: 120000, qty: 17, unit: '명', freq: 1, source: '자체', orgId: 'MGMT' },
            { name: '폐수 및 지정폐기물 처리비 (환경안전보건관리비)', price: 6000000, qty: 1, unit: '회', freq: 1, source: '자체', orgId: 'MGMT' },
        ]
    }
];

export const SUMMARY_DATA = {
    totalIncome: 207108177,
    lastYearIncome: 163651017,
    totalExpense: 207108177,
    lastYearExpense: 163651017,
    sections: [
        { name: '재단운영수입', income: 22615778, lastYearIncome: 2916811 },
        { name: '목적사업수입', income: 178954273, lastYearIncome: 155597078 },
        { name: '재단운영비지출', expense: 2363057, lastYearExpense: 1895008 },
        { name: '목적사업비지출', expense: 178954273, lastYearExpense: 155597078 },
    ]
};

export const BUDGET_VERSION_STATUS = {
    DRAFT: { label: '작성중', color: '#64748b' },
    PENDING: { label: '검토대기', color: '#f59e0b' },
    REVIEWING: { label: '재무조정중', color: '#3b82f6' },
    FINALIZED: { label: '최종확정', color: '#10b981' }
};

export const INITIAL_STATUS = 'DRAFT';

export const INITIAL_LOGS = [
    { id: 1, from: null, to: 'DRAFT', actor: '시스템', date: '2026-02-01', reason: '2026년도 예산 편성 시작' }
];

export const INITIAL_SNAPSHOTS = {};
