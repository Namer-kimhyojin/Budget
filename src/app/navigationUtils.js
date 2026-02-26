export const API_BASE_URL = '';
export const TOKEN_KEY = 'ibms_auth_token';

export const MENU_PATH_BY_ID = {
  dashboard: '/dashboard',
  intake: '/intake',
  planning: '/planning',
  deptApproval: '/dept-approval',
  hqReview: '/hq-review',
  reports: '/reports',
  users: '/users',
  masters: '/masters',
  audit: '/audit',
  notice: '/notice',
  closing: '/closing',
};

const MENU_ID_BY_PATH = Object.fromEntries(
  Object.entries(MENU_PATH_BY_ID).map(([id, path]) => [path, id]),
);

export const toList = (value) => (Array.isArray(value) ? value : value?.results || []);

export const normalizePath = (pathname) => {
  if (!pathname) return '/';
  if (pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
};

/**
 * 경로에서 메뉴 ID를 추출합니다. 서브패스(/intake/versions/3)도 지원합니다.
 * 예: /intake/versions/3 → 'intake'
 */
export const getMenuIdFromPath = (pathname) => {
  const normalized = normalizePath(pathname);
  // 정확 매칭 우선
  if (MENU_ID_BY_PATH[normalized]) return MENU_ID_BY_PATH[normalized];
  // 서브패스: /menu-base/... 형태에서 베이스만 추출
  for (const [id, basePath] of Object.entries(MENU_PATH_BY_ID)) {
    if (normalized.startsWith(basePath + '/')) return id;
  }
  return null;
};

export const getPathFromMenuId = (menuId) => MENU_PATH_BY_ID[menuId] || MENU_PATH_BY_ID.dashboard;

/**
 * 현재 경로에서 서브패스 파라미터를 파싱합니다.
 * /intake/versions/3 → { menuId: 'intake', subPath: 'versions/3', params: { versionId: 3 } }
 * /hq-review?tab=reports → { menuId: 'hqReview', subPath: null, params: { tab: 'reports' } }
 */
export const parseCurrentUrl = () => {
  const pathname = normalizePath(window.location.pathname);
  const search = window.location.search;
  const params = {};

  // 쿼리 파라미터 파싱
  if (search) {
    new URLSearchParams(search).forEach((v, k) => { params[k] = v; });
  }

  // /intake/versions/{id}
  const intakeVersionMatch = pathname.match(/^\/intake\/versions\/(\d+)$/);
  if (intakeVersionMatch) {
    params.versionId = Number(intakeVersionMatch[1]);
    return { menuId: 'intake', params };
  }

  const menuId = getMenuIdFromPath(pathname);
  return { menuId, params };
};

export const safeJsonParse = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};
