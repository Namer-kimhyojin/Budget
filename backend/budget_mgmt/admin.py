from django.contrib import admin
from .models import *

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'org_type', 'parent', 'erpnext_cost_center')
    list_filter = ('org_type', 'parent')
    search_fields = ('code', 'name')

@admin.register(BudgetSubject)
class BudgetSubjectAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'level', 'subject_type', 'erpnext_account')
    list_filter = ('level', 'subject_type')
    search_fields = ('name', 'code')

@admin.register(BudgetEntry)
class BudgetEntryAdmin(admin.ModelAdmin):
    list_display = ('subject', 'organization', 'entrusted_project', 'year', 'status', 'budget_category', 'supplemental_round', 'carryover_type')
    list_filter = ('year', 'status', 'organization', 'entrusted_project', 'budget_category', 'carryover_type')

@admin.register(BudgetDetail)
class BudgetDetailAdmin(admin.ModelAdmin):
    list_display = ('entry', 'name', 'price', 'qty', 'unit', 'source')

@admin.register(BudgetTransfer)
class BudgetTransferAdmin(admin.ModelAdmin):
    list_display = ('from_entry', 'to_entry', 'amount', 'status', 'approved_at', 'created_at')

@admin.register(ApprovalLog)
class ApprovalLogAdmin(admin.ModelAdmin):
    list_display = ('entry', 'from_status', 'to_status', 'actor', 'created_at')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'organization', 'role')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'is_read', 'created_at')

@admin.register(BudgetExecution)
class BudgetExecutionAdmin(admin.ModelAdmin):
    list_display = ('entry', 'executed_at', 'amount', 'created_by')
    list_filter = ('executed_at',)

@admin.register(SpendingLimitRule)
class SpendingLimitRuleAdmin(admin.ModelAdmin):
    list_display = ('subject', 'unit', 'max_unit_price', 'enforcement')
    list_filter = ('enforcement', 'unit')

@admin.register(EntrustedProject)
class EntrustedProjectAdmin(admin.ModelAdmin):
    list_display = ('organization', 'year', 'code', 'name', 'status')
    list_filter = ('organization', 'year', 'status')
    search_fields = ('code', 'name')
