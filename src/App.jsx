import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import MenuPageRouter from './pages/menu/MenuPageRouter';
import { APP_MENU_SECTIONS, isMenuAllowed, ROLE_LABELS } from './pages/menu/config';
import {
  avatarCircle,
  ensureAppGlobalStyles,
  logoBottom,
  logoIconBox,
  logoTop,
  logoTypo,
  navDivider,
  navIconSlot,
  navItem,
  navLabelSlot,
  navScrollArea,
  navSectionTitle,
  navSectionWrap,
  rootWrapper,
  sideNav,
  sidebarLogoArea,
  sidebarUserArea,
  sidebarUserTile,
  uNameLabel,
  uRoleTag,
  viewPortPadding,
  workspaceArea,
} from './app/appChromeStyles';
import { ChevronLeft, ChevronRight, Home, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const TraditionalLedgerView = React.lazy(() => import('./pages/core/TraditionalLedgerView'));
const SubjectManagementView = React.lazy(() => import('./pages/core/SubjectManagementView'));
import { MenuShell } from './pages/menu/shared/menuUi';
import { LoadingScreen, LoginScreen, SystemModal } from './app/components/AppShellOverlays';
import { API_BASE_URL, TOKEN_KEY, getPathFromMenuId, normalizePath, parseCurrentUrl, safeJsonParse, toList } from './app/navigationUtils';

const BRAND_SHORT = 'P.BOS';
const BRAND_FULL_EN = 'PTP Budget Operation System';
const BRAND_FULL_KO = '예산 운영 시스템';
const BRAND_ORG_KO = '포항테크노파크';
const BRAND_ORG_EN = 'Pohang Technopark';
const BRAND_ORG_SHORT = 'PTP';
const BRAND_VERSION = '1.2.0';

const scoreReadableKorean = (text) => {
  if (!text) return 0;
  let score = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if ((code >= 0xac00 && code <= 0xd7a3) || ch === ' ' || ch === '\n' || ch === '\t') score += 2;
    else if ((code >= 0x30 && code <= 0x39) || (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) score += 1;
    else if (code === 0xfffd) score -= 4;
    else score -= 1;
  }
  return score;
};
const repairDisplayText = (value) => {
  if (value == null) return value;
  let text = String(value);
  if (!text) return text;
  if (/[\u0530-\u058F]/.test(text)) {
    text = text.replace(/[\u0530-\u058F]+/g, '지금');
  }
  const looksMojibake = /[ÃÂÐÑìíëêòøæœž]/.test(text);
  const isLatin1Range = [...text].every((ch) => ch.charCodeAt(0) <= 0xff);
  if (!looksMojibake || !isLatin1Range || typeof TextDecoder === 'undefined') return text;
  try {
    const bytes = Uint8Array.from([...text].map((ch) => ch.charCodeAt(0)));
    const repaired = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return scoreReadableKorean(repaired) > scoreReadableKorean(text) ? repaired : text;
  } catch {
    return text;
  }
};
const normalizeTextFields = (list, keys) => (
  (Array.isArray(list) ? list : []).map((item) => {
    if (!item || typeof item !== 'object') return item;
    const next = { ...item };
    keys.forEach((key) => {
      if (typeof next[key] === 'string') next[key] = repairDisplayText(next[key]);
    });
    return next;
  })
);

const apiErrorMessage = (e, fallback = '오류가 발생했습니다.') => {
  const data = e?.response?.data;
  if (!data) {
    const status = e?.response?.status;
    const msg = e?.message || '네트워크 오류';
    return status ? `${fallback} (상태코드 ${status})` : `${fallback} (${msg})`;
  }
  if (typeof data === 'string') {
    if (data.includes('<html') || data.includes('<!DOCTYPE')) {
      const titleMatch = data.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch?.[1]?.trim();
      return title ? `서버 오류: ${title}` : fallback;
    }
    return data;
  }
  if (typeof data.error === 'string') {
    const trace = typeof data.trace_id === 'string' ? ` [추적ID: ${data.trace_id}]` : '';
    if (typeof data.details === 'string' && data.details.trim()) return `${data.error}: ${data.details}${trace}`;
    if (data.details && typeof data.details === 'object') return `${data.error}: ${JSON.stringify(data.details)}${trace}`;
    return `${data.error}${trace}`;
  }
  const parts = [];
  Object.entries(data).forEach(([k, v]) => {
    if (Array.isArray(v)) parts.push(`${k}: ${v.join(', ')}`);
    else if (typeof v === 'string') parts.push(`${k}: ${v}`);
  });
  if (typeof data.trace_id === 'string') parts.push(`추적ID: ${data.trace_id}`);
  return parts.length ? parts.join('\n') : fallback;
};

ensureAppGlobalStyles();

export default function App() {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => safeJsonParse(localStorage.getItem('ibms_user'), null));
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard';
    return parseCurrentUrl().menuId || 'dashboard';
  });
  // 초기 URL에서 파싱한 서브패스 파라미터 (페이지 컴포넌트에 전달)
  const [initialUrlParams] = useState(() => {
    if (typeof window === 'undefined') return {};
    return parseCurrentUrl().params || {};
  });
  const [loading, setLoading] = useState(!!token);

  const [orgs, setOrgs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [version, setVersion] = useState(null);
  const [versions, setVersions] = useState([]);
  const [modal, setModal] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [collapsedHoverLabel, setCollapsedHoverLabel] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('isSidebarCollapsed') === 'true';
  });

  const userMenuRef = useRef(null);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('isSidebarCollapsed', String(next));
      return next;
    });
  };
  const showCollapsedHoverLabel = useCallback((text, element) => {
    if (!isSidebarCollapsed || !element) return;
    const rect = element.getBoundingClientRect();
    setCollapsedHoverLabel({
      text,
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  }, [isSidebarCollapsed]);
  const hideCollapsedHoverLabel = useCallback(() => {
    setCollapsedHoverLabel(null);
  }, []);
  const bootstrapInFlightRef = useRef(false);
  const refreshErrorShownRef = useRef(false);
  const visibleMenuSections = useMemo(() => {
    return APP_MENU_SECTIONS
      .map(section => ({ ...section, items: section.items.filter(item => isMenuAllowed(user?.role, item.id)) }))
      .filter(section => section.items.length > 0);
  }, [user?.role]);
  const allowedMenuIds = useMemo(() => visibleMenuSections.flatMap(section => section.items.map(item => item.id)), [visibleMenuSections]);

  const authAxios = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE_URL });
    if (token) {
      instance.defaults.headers.common['Authorization'] = `Token ${token}`;
    }
    return instance;
  }, [token]);

  const modalApi = useMemo(() => ({
    alert: (message, title = '알림') => new Promise(res => setModal({ type: 'alert', title, message, onClose: () => { setModal(null); res(true); } })),
    confirm: (message, title = '확인') => new Promise(res => setModal({ type: 'confirm', title, message, onConfirm: () => { setModal(null); res(true); }, onCancel: () => { setModal(null); res(false); } })),
  }), []);

  const handleLogout = useCallback(() => {
    bootstrapInFlightRef.current = false;
    refreshErrorShownRef.current = false;
    setIsUserMenuOpen(false);
    setIsPasswordModalOpen(false);
    setIsChangingPassword(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setToken(null); setUser(null);
    setLoading(false);
    setOrgs([]);
    setSubjects([]);
    setProjects([]);
    setEntries([]);
    setVersion(null);
    setVersions([]);
    setModal(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('ibms_user');
  }, []);

  const requestLogout = useCallback(async () => {
    setIsUserMenuOpen(false);
    const confirmed = await modalApi.confirm('로그아웃 하시겠습니까?', '로그아웃');
    if (!confirmed) return;
    handleLogout();
  }, [handleLogout, modalApi]);

  const openPasswordModal = useCallback(() => {
    setIsUserMenuOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordModalOpen(true);
  }, []);

  const closePasswordModal = useCallback(() => {
    if (isChangingPassword) return;
    setIsPasswordModalOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  }, [isChangingPassword]);

  const submitPasswordChange = useCallback(async () => {
    if (isChangingPassword) return;
    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      await modalApi.alert('현재 비밀번호, 새 비밀번호, 새 비밀번호 확인을 모두 입력해 주세요.', '입력 확인');
      return;
    }
    if (newPassword !== confirmPassword) {
      await modalApi.alert('새 비밀번호와 확인 값이 일치하지 않습니다.', '입력 확인');
      return;
    }
    if (currentPassword === newPassword) {
      await modalApi.alert('새 비밀번호는 현재 비밀번호와 다르게 입력해 주세요.', '입력 확인');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authAxios.post('/api/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      const nextToken = res?.data?.token;
      if (nextToken) {
        setToken(nextToken);
        localStorage.setItem(TOKEN_KEY, nextToken);
      }
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      await modalApi.alert('비밀번호가 변경되었습니다.', '변경 완료');
    } catch (e) {
      if (e?.response?.status === 401) {
        handleLogout();
        return;
      }
      await modalApi.alert(apiErrorMessage(e, '비밀번호 변경에 실패했습니다.'), '변경 실패');
    } finally {
      setIsChangingPassword(false);
    }
  }, [authAxios, handleLogout, isChangingPassword, modalApi, passwordForm]);

  const bootstrap = useCallback(async () => {
    if (!token) return;
    if (bootstrapInFlightRef.current) return;
    bootstrapInFlightRef.current = true;
    setLoading(true);
    try {
      const me = await authAxios.get(`/api/auth/me/`);
      const meData = me?.data || {};
      const meUser = meData.user || {};
      const meProfile = meData.profile || {};
      const mergedUser = {
        ...meUser,
        role: meProfile.role,
        organization: meProfile.organization,
        organization_name: meProfile.organization_name,
        team: meProfile.team,
        team_name: meProfile.team_name,
      };
      setUser(mergedUser);
      localStorage.setItem('ibms_user', JSON.stringify(mergedUser));

      const [o, s, v, p] = await Promise.all([
        authAxios.get(`/api/orgs/`),
        authAxios.get(`/api/subjects/`),
        authAxios.get(`/api/versions/`),
        authAxios.get(`/api/entrusted-projects/`),
      ]);
      setOrgs(normalizeTextFields(toList(o.data), ['name', 'parent_name']));
      setSubjects(normalizeTextFields(toList(s.data), ['name', 'description']));
      setProjects(normalizeTextFields(toList(p.data), ['name', 'source_project_name', 'organization_name']));

      const vl = toList(v.data);
      setVersions(vl);
      if (vl.length > 0) {
        const sorted = [...vl].sort((a, b) => b.year - a.year || b.round - a.round);
        setVersion(sorted.find(v => v.round === 0) || sorted[0]);
      } else {
        setVersion(null);
        setEntries([]);
      }
    } catch (e) {
      console.error('Bootstrap Error:', e);
      if (e.response?.status === 401) {
        handleLogout();
      } else {
        modalApi.alert(apiErrorMessage(e, '초기 데이터를 불러오는 데 실패했습니다.'));
      }
    } finally {
      setLoading(false);
      bootstrapInFlightRef.current = false;
    }
  }, [token, authAxios, handleLogout, modalApi]);

  const refresh = useCallback(async (targetVersion = version) => {
    if (!targetVersion || !token) return;
    try {
      const r = await authAxios.get(`/api/entries/`, { params: { year: targetVersion.year, round: targetVersion.round } });
      setEntries(toList(r.data));
      refreshErrorShownRef.current = false;
    } catch (e) {
      console.error(e);
      if (e.response?.status === 401) {
        handleLogout();
        return;
      }
      if (!refreshErrorShownRef.current) {
        refreshErrorShownRef.current = true;
        modalApi.alert(apiErrorMessage(e, '예산 항목을 새로고침하는 데 실패했습니다.'));
      }
    }
  }, [authAxios, handleLogout, modalApi, token, version]);

  const refreshSubjects = async () => {
    if (!token) return;
    try {
      const r = await authAxios.get('/api/subjects/');
      setSubjects(normalizeTextFields(toList(r.data), ['name', 'description']));
    } catch (e) {
      console.error(e);
    }
  };

  const refreshProjects = async () => {
    if (!token) return;
    try {
      const r = await authAxios.get('/api/entrusted-projects/');
      setProjects(normalizeTextFields(toList(r.data), ['name', 'source_project_name', 'organization_name']));
    } catch (e) {
      console.error(e);
    }
  };

  const createVersion = async (year) => {
    try {
      const res = await authAxios.post('/api/versions/create_next_round/', { year });
      setVersions(p => [...p, res.data]);
      setVersion(res.data);
      modalApi.alert(`${res.data.name}이 생성되었습니다.`);
    } catch (e) {
      modalApi.alert(apiErrorMessage(e, '버전 생성 실패'));
    }
  };

  const handleVersionStatusChange = (updatedVersion) => {
    if (!updatedVersion?.id) return;
    setVersion((prev) => (
      prev?.id === updatedVersion.id
        ? { ...prev, ...updatedVersion }
        : prev
    ));
    setVersions((prev) => prev.map((item) => (
      item?.id === updatedVersion.id
        ? { ...item, ...updatedVersion }
        : item
    )));
  };

  const handleLogin = async (username, password) => {
    try {
      const res = await axios.post('/api/auth/login/', { username, password });
      const { token: tk, user: us, profile } = res.data;
      const mergedUser = {
        ...us,
        role: profile?.role,
        organization: profile?.organization,
        organization_name: profile?.organization_name,
        team: profile?.team,
        team_name: profile?.team_name,
      };
      setToken(tk); setUser(mergedUser);
      localStorage.setItem(TOKEN_KEY, tk);
      localStorage.setItem('ibms_user', JSON.stringify(mergedUser));
      setActiveTab('dashboard');
      window.history.pushState({}, '', getPathFromMenuId('dashboard'));
    } catch (e) {
      const status = e?.response?.status;
      if (status === 400 || status === 401) {
        modalApi.alert('아이디 또는 비밀번호가 올바르지 않습니다.\n다시 확인 후 입력해 주세요.', '로그인 실패');
      } else if (status >= 500) {
        modalApi.alert('서버에 일시적인 오류가 발생했습니다.\n잠시 후 다시 시도해 주세요.\n\n문제가 계속되면 시스템 관리자에게 문의하세요.', '시스템 오류');
      } else if (!status) {
        modalApi.alert('서버에 연결할 수 없습니다.\n네트워크 연결 상태를 확인해 주세요.', '연결 오류');
      } else {
        modalApi.alert(`로그인 중 오류가 발생했습니다. (${status})\n잠시 후 다시 시도해 주세요.`, '오류');
      }
    }
  };

  useEffect(() => { if (token) bootstrap(); }, [token, bootstrap]);
  useEffect(() => {
    if (!version || !token) return;
    if (activeTab === 'planning') return;
    refresh(version);
  }, [version, token, activeTab, refresh]);
  useEffect(() => { refreshErrorShownRef.current = false; }, [token, version?.id]);
  useEffect(() => {
    const handlePopState = () => {
      const { menuId } = parseCurrentUrl();
      if (menuId) setActiveTab(menuId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (allowedMenuIds.length === 0) return;
    if (token && loading) return;
    if (allowedMenuIds.includes(activeTab)) return;

    const { menuId: fromMenuId } = parseCurrentUrl();
    const fallbackMenuId = fromMenuId && allowedMenuIds.includes(fromMenuId)
      ? fromMenuId
      : allowedMenuIds[0];

    if (activeTab !== fallbackMenuId) setActiveTab(fallbackMenuId);
    const fallbackPath = getPathFromMenuId(fallbackMenuId);
    if (normalizePath(window.location.pathname) !== fallbackPath) {
      window.history.replaceState({}, '', fallbackPath);
    }
  }, [allowedMenuIds, activeTab, token, loading]);

  useEffect(() => {
    const basePath = getPathFromMenuId(activeTab);
    const currentPath = normalizePath(window.location.pathname);
    // 현재 URL이 이미 이 메뉴의 서브패스인 경우 덮어쓰지 않음
    if (currentPath === basePath || currentPath.startsWith(basePath + '/')) return;
    window.history.pushState({}, '', basePath);
  }, [activeTab]);
  useEffect(() => {
    if (!isSidebarCollapsed) setCollapsedHoverLabel(null);
  }, [isSidebarCollapsed]);
  useEffect(() => {
    const clear = () => setCollapsedHoverLabel(null);
    window.addEventListener('scroll', clear, true);
    window.addEventListener('resize', clear);
    return () => {
      window.removeEventListener('scroll', clear, true);
      window.removeEventListener('resize', clear);
    };
  }, []);
  useEffect(() => {
    if (!isUserMenuOpen) return undefined;
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isUserMenuOpen]);

  if (!token) return (<><LoginScreen onLogin={handleLogin} brandShort={BRAND_SHORT} brandFullEn={BRAND_FULL_EN} orgKo={BRAND_ORG_KO} orgEn={BRAND_ORG_EN} orgShort={BRAND_ORG_SHORT} version={BRAND_VERSION} /><SystemModal modal={modal} /></>);
  if (loading) return <LoadingScreen />;

  return (
    <div style={rootWrapper}>
      <aside style={{
        ...sideNav,
        width: isSidebarCollapsed ? 68 : 230,
        minWidth: isSidebarCollapsed ? 68 : 230,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}>
        {/* Logo area */}
        <div
          style={{
            ...sidebarLogoArea,
            padding: isSidebarCollapsed ? '20px 0' : '20px 18px 16px',
            justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.3s'
          }}
          onClick={() => setActiveTab('dashboard')}
          title={BRAND_FULL_KO}
        >
          <div style={logoIconBox}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>PTP</span>
          </div>
          {!isSidebarCollapsed && (
            <div style={logoTypo}>
              <div style={logoTop}>{BRAND_SHORT}</div>
              <div style={logoBottom}>{BRAND_FULL_KO}</div>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <div
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            top: 22,
            right: isSidebarCollapsed ? -15 : 10,
            width: 24,
            height: 24,
            background: isSidebarCollapsed ? 'rgba(8,145,178,0.7)' : 'rgba(255,255,255,0.06)',
            border: isSidebarCollapsed ? 'none' : '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            color: '#fff',
            transition: 'all 0.3s',
            boxShadow: isSidebarCollapsed ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
          }}
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </div>

        {/* Menu items */}
        <div style={{
          ...navScrollArea,
          padding: isSidebarCollapsed ? '16px 8px' : '16px 10px'
        }}>
          {visibleMenuSections.map(section => (
            <div key={section.key} style={navSectionWrap}>
              {!isSidebarCollapsed && <div style={navSectionTitle}>{section.title}</div>}
              {section.items.map(menu => {
                const Icon = menu.icon;
                const isActive = activeTab === menu.id;
                return (
                  <div
                    key={menu.id}
                    onClick={() => { setActiveTab(menu.id); hideCollapsedHoverLabel(); }}
                    onMouseEnter={(event) => showCollapsedHoverLabel(menu.label, event.currentTarget)}
                    onMouseLeave={hideCollapsedHoverLabel}
                    style={{
                      ...navItem,
                      justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                      padding: isSidebarCollapsed ? '0' : '0 12px',
                      color: isActive ? '#e2f8f8' : '#7a96b0',
                      background: isActive ? 'rgba(8,145,178,0.15)' : 'transparent',
                      borderLeft: isSidebarCollapsed ? 'none' : (isActive ? '2px solid #0891b2' : '2px solid transparent'),
                      borderRight: isSidebarCollapsed && isActive ? '2px solid #0891b2' : 'none',
                    }}
                  >
                    <div style={{
                      ...navIconSlot,
                      width: isSidebarCollapsed ? 'auto' : 20,
                    }}><Icon size={17} /></div>
                    {!isSidebarCollapsed && <span style={navLabelSlot}>{menu.label}</span>}
                  </div>
                );
              })}
              {!isSidebarCollapsed && <div style={navDivider} />}
            </div>
          ))}
        </div>

        {/* User / Logout at bottom */}
        <div style={{
          ...sidebarUserArea,
          padding: isSidebarCollapsed ? '12px 8px' : '12px 14px'
        }}>
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <div
              style={{
                ...sidebarUserTile,
                justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                padding: isSidebarCollapsed ? '8px 0' : '8px 10px'
              }}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              onMouseEnter={(event) => showCollapsedHoverLabel('계정 메뉴', event.currentTarget)}
              onMouseLeave={hideCollapsedHoverLabel}
            >
              <div style={avatarCircle}>{(user?.username || '').substring(0, 2).toUpperCase()}</div>
              {!isSidebarCollapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={uNameLabel}>{user?.username}</div>
                  <div style={uRoleTag}>{ROLE_LABELS[user?.role] || user?.role}</div>
                </div>
              )}
              {!isSidebarCollapsed && <ChevronRight size={14} style={{ opacity: 0.55, flexShrink: 0, transform: isUserMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }} />}
            </div>
            {isUserMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: isSidebarCollapsed ? 'calc(100% + 8px)' : 0,
                  width: 176,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  boxShadow: '0 16px 32px -16px rgba(15,23,42,0.35)',
                  zIndex: 20,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={openPasswordModal}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    background: '#ffffff',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: '#0f172a',
                    fontWeight: 600,
                  }}
                  title="비밀번호 변경"
                >
                  비밀번호 변경
                </button>
                <button
                  type="button"
                  onClick={requestLogout}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderTop: '1px solid #f1f5f9',
                    background: '#ffffff',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: '#dc2626',
                    fontWeight: 700,
                  }}
                  title="로그아웃"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {isPasswordModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 31000,
            background: 'rgba(15,23,42,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)',
            padding: 16,
          }}
          onClick={closePasswordModal}
        >
          <div
            style={{
              width: 420,
              maxWidth: '92vw',
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              boxShadow: '0 24px 48px -18px rgba(15,23,42,0.32)',
              padding: '20px 20px 16px',
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>비밀번호 변경</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>현재 비밀번호</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>새 비밀번호</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>새 비밀번호 확인</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') submitPasswordChange();
                  }}
                  style={{ height: 40, border: '1px solid #cbd5e1', borderRadius: 8, padding: '0 12px', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={isChangingPassword}
                style={{
                  padding: '9px 14px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  borderRadius: 8,
                  color: '#64748b',
                  cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitPasswordChange}
                disabled={isChangingPassword}
                style={{
                  padding: '9px 14px',
                  border: 'none',
                  background: '#0f766e',
                  color: '#ffffff',
                  borderRadius: 8,
                  cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                  opacity: isChangingPassword ? 0.7 : 1,
                  fontWeight: 700,
                }}
              >
                {isChangingPassword ? '변경 중...' : '변경'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSidebarCollapsed && collapsedHoverLabel && (
        <div
          style={{
            position: 'fixed',
            left: collapsedHoverLabel.left,
            top: collapsedHoverLabel.top,
            transform: 'translateY(-50%)',
            zIndex: 32000,
            pointerEvents: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0,
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '7px solid #111827',
            }}
          />
          <div
            style={{
              background: '#111827',
              color: '#f8fafc',
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
              padding: '8px 10px',
              borderRadius: 8,
              whiteSpace: 'nowrap',
              boxShadow: '0 12px 20px -12px rgba(0,0,0,0.7)',
            }}
          >
            {collapsedHoverLabel.text}
          </div>
        </div>
      )}

      {/* Right: main workspace */}
      <main style={workspaceArea}>
        <div style={viewPortPadding}>
          <Suspense fallback={<LoadingScreen />}>
            {activeTab === 'planning' && (
              <MenuShell menuId="planning" user={user} breadcrumbs={['예산 입력']} contextBadge={version ? `${version.year}년도 ${version.name}` : ''} hideHero={true}>
                <TraditionalLedgerView authAxios={authAxios} entries={entries} subjects={subjects} projects={projects} orgs={orgs} onRefresh={refresh} onRefreshSubjects={refreshSubjects} onRefreshProjects={refreshProjects} modalApi={modalApi} version={version} versions={versions} setVersion={setVersion} onVersionStatusChange={handleVersionStatusChange} onCreateVersion={createVersion} user={user} />
              </MenuShell>
            )}
            {activeTab === 'masters' && (
              <MenuShell menuId="masters" user={user} hideHero={true}>
                <SubjectManagementView authAxios={authAxios} subjects={subjects} orgs={orgs} projects={projects} entries={entries} onRefresh={bootstrap} onNavigate={setActiveTab} modalApi={modalApi} />
              </MenuShell>
            )}
            {activeTab !== 'planning' && activeTab !== 'masters' && (
              <MenuPageRouter
                menuId={activeTab}
                authAxios={authAxios}
                version={version}
                versions={versions}
                setVersion={setVersion}
                onCreateVersion={createVersion}
                onBootstrap={bootstrap}
                onRefreshEntries={refresh}
                subjects={subjects}
                orgs={orgs}
                projects={projects}
                entries={entries}
                user={user}
                modalApi={modalApi}
                onNavigate={setActiveTab}
                initialUrlParams={initialUrlParams}
              />
            )}
          </Suspense>
        </div>
      </main>
      <SystemModal modal={modal} />
    </div>
  );
}
