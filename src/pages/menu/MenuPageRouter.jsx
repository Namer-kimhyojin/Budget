import React, { Suspense, lazy } from 'react';
import { menuStyles, LoadingSpinner } from './shared/menuUi';
import { noOpModal } from './shared/utils';

const { emptyData } = menuStyles;

const DashboardPage = lazy(() => import('./pages/Dashboard'));
const VersionIntakePage = lazy(() => import('./pages/VersionIntake'));
const DepartmentApprovalPage = lazy(() => import('./pages/DepartmentApproval'));
const HQReviewPage = lazy(() => import('./pages/HQReview/index'));
const NoticePage = lazy(() => import('./pages/NoticePage'));
const ClosingStatusPage = lazy(() => import('./pages/ClosingStatusPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage')); // Kept for lazyness but unused logic
const UserAccessPage = lazy(() => import('./pages/UserAccess'));
const AuditLogPage = lazy(() => import('./pages/AuditLog'));

export function MenuPageRouter({
  menuId,
  authAxios,
  version,
  versions,
  setVersion,
  onCreateVersion,
  onBootstrap,
  onRefreshEntries,
  subjects,
  orgs,
  entries,
  projects = [],
  user,
  modalApi,
  onNavigate,
  initialUrlParams = {},
}) {
  const modal = modalApi || noOpModal;
  let Page = null;
  let pageProps = {};

  switch (menuId) {
    case 'dashboard':
      Page = DashboardPage;
      pageProps = { menuId, authAxios, version, versions, setVersion, orgs, entries, subjects, projects, user, onRefreshEntries, onBootstrap, modalApi: modal, onNavigate };
      break;
    case 'intake':
      Page = VersionIntakePage;
      pageProps = { menuId, authAxios, version, versions, setVersion, onCreateVersion, onBootstrap, user, modalApi: modal, initialUrlParams };
      break;
    case 'deptApproval':
      Page = DepartmentApprovalPage;
      pageProps = { menuId, authAxios, version, versions, setVersion, subjects, orgs, entries, projects: projects || [], user, onRefreshEntries, modalApi: modal };
      break;
    case 'hqReview':
      Page = HQReviewPage;
      pageProps = { menuId, authAxios, version, versions, setVersion, orgs, entries, subjects, user, onRefreshEntries, modalApi: modal, onNavigate, initialUrlParams };
      break;
    case 'notice':
      Page = NoticePage;
      pageProps = { menuId, authAxios, user, modalApi: modal };
      break;
    case 'closing':
      Page = ClosingStatusPage;
      pageProps = { menuId, authAxios, version, orgs, entries, user, onBootstrap, onRefreshEntries, modalApi: modal };
      break;
    case 'users':
      Page = UserAccessPage;
      pageProps = { menuId, authAxios, user, orgs, modalApi: modal };
      break;
    case 'audit':
      Page = AuditLogPage;
      pageProps = { menuId, authAxios, user, modalApi: modal };
      break;
    default:
      Page = null;
      pageProps = {};
      break;
  }

  if (!Page) return <div style={emptyData}>준비 중인 모듈입니다.</div>;

  return (
    <Suspense fallback={<LoadingSpinner message="페이지를 로드하는 중..." />}>
      <Page {...pageProps} />
    </Suspense>
  );
}

export default MenuPageRouter;
