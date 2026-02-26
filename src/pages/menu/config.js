import {
  Activity,
  BarChart3,
  ClipboardCheck,
  FileSpreadsheet,
  History,
  Layers,
  Mail,
  Settings,
  ShieldCheck,
  Table2,
  Users,
} from 'lucide-react';

export const APP_MENU_SECTIONS = [
  {
    key: 'budget-flow',
    title: '예산 프로세스',
    items: [
      { id: 'dashboard', icon: BarChart3, label: '대시보드' },
      { id: 'intake', icon: Layers, label: '접수 관리' },
      { id: 'planning', icon: Table2, label: '예산 입력' },
    ],
  },
  {
    key: 'admin',
    title: '관리',
    items: [
      { id: 'users', icon: Users, label: '사용자/권한 관리' },
      { id: 'masters', icon: Settings, label: '기준정보 관리' },
      { id: 'audit', icon: History, label: '감사로그' },
    ],
  },
];

export const APP_MENU_META = APP_MENU_SECTIONS.flatMap(section => section.items);

export const MENU_LAYOUT_BLUEPRINTS = {
  dashboard: {
    title: '예산 업무 대시보드',
    description: '회차 진행률, 부서별 상태, 승인 대기 건수를 한 화면에서 확인합니다.',
  },
  intake: {
    title: '접수 관리',
    description: '본예산/추경 예산서를 생성하고 접수 기간과 상태를 관리합니다.',
  },
  deptApproval: {
    title: '매니저 확인',
    description: '팀원이 제출한 예산 편성안을 매니저가 검토하고 총무팀으로 제출하거나 반려합니다.',
  },
  hqReview: {
    title: '총무팀 확인',
    description: '매니저가 제출한 예산안을 총무팀이 최종 검토하고 예산서를 확정합니다.',
  },
  planning: {
    title: '예산 입력',
    description: '부서별 상세 예산 편성 내용을 작성하고 관리합니다.',
  },
  reports: {
    title: '보고서/엑셀 출력',
    description: '마감 데이터를 기준으로 회차별/부서별 보고서를 엑셀로 출력합니다.',
  },
  users: {
    title: '사용자/권한 관리',
    description: '사용자 계정 생성, 역할 부여, 메뉴 접근 권한을 통제합니다.',
  },
  masters: {
    title: '기준정보 관리',
    description: '부서, 사업, 계정 체계를 관리합니다.',
  },
  audit: {
    title: '감사로그',
    description: '예산 수정/승인/확정/권한 변경 내역을 감사 추적용으로 보관합니다.',
  },
};

export const ENTRY_STATUS_LABELS = {
  DRAFT: '작성중',
  PENDING: '작성완료',
  REVIEWING: '검토중',
  FINALIZED: '확정됨',
};

export const VERSION_STATUS_LABELS = {
  DRAFT: '대기중',
  PENDING: '접수중',
  EXPIRED: '접수마감',
  CONFIRMED: '확정됨',
  CLOSED: '마감됨',
};

export const ROLE_LABELS = {
  ADMIN: '관리자',
  MANAGER: '총무팀',   // 구 REVIEWER
  STAFF: '부서담당자', // 구 MANAGER
  REVIEWER: '총무팀',  // 하위 호환
  REQUESTOR: '부서담당자', // 하위 호환
  ORG_VIEWER: '열람자',
};

export const ROLE_MENU_ACCESS = {
  // 관리자: 전체 접근
  ADMIN: ['dashboard', 'intake', 'planning', 'reports', 'users', 'masters', 'audit'],
  // 총무팀(구 REVIEWER): 전체 부서 편성/관리 + 확인 메뉴
  MANAGER: ['dashboard', 'planning', 'reports', 'masters', 'audit'],
  // 부서담당자(구 MANAGER): 본인 부서 편성/관리
  STAFF: ['dashboard', 'planning', 'reports', 'masters'],
  // 하위 호환
  REVIEWER: ['dashboard', 'planning', 'reports', 'masters', 'audit'],
  REQUESTOR: ['dashboard', 'planning', 'reports', 'masters'],
  ORG_VIEWER: ['dashboard', 'reports'],
};

export const isMenuAllowed = (role, menuId) => {
  const list = ROLE_MENU_ACCESS[role] || ['dashboard', 'planning'];
  return list.includes(menuId);
};
