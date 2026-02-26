from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'orgs', OrganizationViewSet)
router.register(r'subjects', BudgetSubjectViewSet)
router.register(r'entrusted-projects', EntrustedProjectViewSet)
router.register(r'entries', BudgetEntryViewSet)
router.register(r'versions', BudgetVersionViewSet)
router.register(r'transfers', BudgetTransferViewSet)
router.register(r'details', BudgetDetailViewSet)
router.register(r'executions', BudgetExecutionViewSet)
router.register(r'rules', SpendingLimitRuleViewSet)
router.register(r'profiles', UserProfileViewSet)
router.register(r'logs', ApprovalLogViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'erpnext', ERPNextViewSet, basename='erpnext')
router.register(r'comments', SubmissionCommentViewSet, basename='comments')
router.register(r'supporting-docs', SupportingDocumentViewSet, basename='supporting-docs')

urlpatterns = [
    path('auth/signup/', AuthSignUpView.as_view()),
    path('auth/login/', AuthLoginView.as_view()),
    path('auth/logout/', AuthLogoutView.as_view()),
    path('auth/me/', AuthMeView.as_view()),
    path('auth/find-id/', AuthFindIdView.as_view()),
    path('auth/withdraw/', AuthWithdrawView.as_view()),
    path('auth/assign-role/', AuthAssignRoleView.as_view()),
    path('auth/change-password/', AuthChangePasswordView.as_view()),
    path('auth/password-policy/', AuthPasswordPolicyView.as_view()),
    path('auth/users/', AuthAdminUsersView.as_view()),
    path('auth/users/<int:user_id>/', AuthAdminUserDetailView.as_view()),
    path('entries/workflow/', BudgetEntryViewSet.as_view({'post': 'workflow'})),
    path('entries/bulk-upsert/', BudgetBulkUpsertView.as_view()),
    path('dashboard/summary/', DashboardSummaryView.as_view()),
    path('', include(router.urls)),
]
