from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class Organization(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    org_type = models.CharField(max_length=20, default='dept')  # dept, team, etc.
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    erpnext_cost_center = models.CharField(max_length=140, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name


class BudgetSubject(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    level = models.IntegerField()  # 1: 장, 2: 관, 3: 항, 4: 목
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    subject_type = models.CharField(max_length=10, choices=[('income', 'Income'), ('expense', 'Expense')])
    erpnext_account = models.CharField(max_length=140, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f"[{self.code}] {self.name}"


class BudgetVersion(models.Model):
    CREATION_MODE_CHOICES = [
        ('NEW', '신규작성'),
        ('TRANSFER', '이관작성'),
    ]

    year = models.IntegerField()
    round = models.IntegerField(default=0)
    name = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=[('DRAFT', '준비중'), ('PENDING', '접수중'), ('CONFIRMED', '확정됨'), ('CLOSED', '마감됨')], default='DRAFT')
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    guidelines = models.TextField(null=True, blank=True)
    guidelines_file = models.FileField(upload_to='version_guidelines/', null=True, blank=True)
    creation_mode = models.CharField(max_length=20, choices=CREATION_MODE_CHOICES, default='NEW')
    source_version = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='derived_versions')

    class Meta:
        unique_together = ('year', 'round')

    @property
    def computed_status(self):
        from datetime import date
        if self.status in ['CLOSED', 'CONFIRMED']:
            return self.status
        if self.start_date and self.end_date:
            today = date.today()
            if today < self.start_date:
                return 'DRAFT'
            elif today > self.end_date:
                return 'EXPIRED'
            else:
                return 'PENDING'
        return self.status

    def __str__(self):
        return f"{self.name} ({self.year}-{self.round})"


class EntrustedProject(models.Model):
    STATUS_CHOICES = [
        ('PLANNED', '계획됨'),
        ('ACTIVE', '활성'),
        ('CLOSED', '종료'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name='entrusted_projects')
    year = models.IntegerField()
    code = models.CharField(max_length=50)  # 내부 자동 생성 코드 (사용자 비노출)
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    # 예산 차용: 이전 연도 사업의 예산 구성을 참조
    source_project = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='derived_projects',
        verbose_name='차용 원본 사업',
        help_text='이전 연도 사업 등 예산 구성을 차용할 원본 사업'
    )

    class Meta:
        unique_together = ('organization', 'year', 'code')

    def __str__(self):
        return f"[{self.year}] {self.name}"


class BudgetEntry(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', '작성중'),
        ('PENDING', '상신됨'),
        ('REVIEWING', '검토중'),
        ('FINALIZED', '확정됨'),
    ]
    CATEGORY_CHOICES = [
        ('ORIGINAL', '본예산'),
        ('SUPPLEMENTAL', '추경'),
        ('CARRYOVER', '이월'),
    ]
    CARRYOVER_CHOICES = [
        ('NONE', '없음'),
        ('SPECIFIC', '명시이월'),
        ('ACCIDENT', '사고이월'),
        ('CONTINUING', '계속비이월'),
    ]

    subject = models.ForeignKey(BudgetSubject, on_delete=models.PROTECT)
    organization = models.ForeignKey(Organization, on_delete=models.PROTECT)
    entrusted_project = models.ForeignKey(EntrustedProject, on_delete=models.PROTECT, null=True, blank=True, related_name='entries')
    year = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    last_year_amount = models.BigIntegerField(default=0)
    budget_category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='ORIGINAL')
    supplemental_round = models.IntegerField(default=0)
    carryover_type = models.CharField(max_length=20, choices=CARRYOVER_CHOICES, default='NONE')

    total_amount = models.BigIntegerField(default=0)
    executed_amount = models.BigIntegerField(default=0)
    remaining_amount = models.BigIntegerField(default=0)

    class Meta:
        unique_together = ('subject', 'organization', 'entrusted_project', 'year', 'supplemental_round')
        indexes = [
            models.Index(fields=['year', 'organization']),
            models.Index(fields=['year', 'supplemental_round']),
            models.Index(fields=['organization', 'year', 'supplemental_round']),
            models.Index(fields=['status']),
        ]
        verbose_name = 'Budget Entry'
        verbose_name_plural = 'Budget Entries'

    def update_totals(self):
        """
        Recalculates totals from related details and executions.
        Call this method whenever details or executions change.
        """
        # Calculate total_amount from BudgetDetail
        details_sum = sum(detail.total_price for detail in self.details.all())
        self.total_amount = details_sum

        # Calculate executed_amount from BudgetExecution
        executions_sum = sum(execution.amount for execution in self.executions.all())
        self.executed_amount = executions_sum

        # Update remaining_amount
        self.remaining_amount = self.total_amount - self.executed_amount
        self.save()

    @property
    def executed_total(self):
        # Compatibility property for existing code relying on 'executed_total'
        return self.executed_amount


class BudgetDetail(models.Model):
    entry = models.ForeignKey(BudgetEntry, on_delete=models.CASCADE, related_name='details')
    name = models.CharField(max_length=255)
    price = models.BigIntegerField()
    qty = models.FloatField()
    freq = models.IntegerField(default=1)
    currency_unit = models.CharField(max_length=20, default='원')
    unit = models.CharField(max_length=20)
    freq_unit = models.CharField(max_length=20, default='회')
    sort_order = models.IntegerField(default=0)
    sub_label = models.CharField(max_length=20, null=True, blank=True)
    source = models.CharField(max_length=50)  # 국비, 도비, 시비, 민간, 자체
    region_context = models.TextField(null=True, blank=True)  # 지역 특성(산업/지리/인구)
    weather_context = models.TextField(null=True, blank=True)  # 기후/날씨 특성
    evidence_source_name = models.CharField(max_length=200, null=True, blank=True)  # 출처명
    evidence_source_url = models.URLField(max_length=500, null=True, blank=True)  # 출처 URL
    evidence_as_of = models.DateField(null=True, blank=True)  # 기준일
    is_rate = models.BooleanField(default=False)  # 요율(%) 계산 여부
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    transfer_source_detail = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='transferred_details')
    before_snapshot = models.JSONField(null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def clean(self):
        if self.price < 0:
            raise ValidationError('Price cannot be negative.')
        if self.qty < 0:
            raise ValidationError('Quantity cannot be negative.')

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    @property
    def total_price(self):
        if self.is_rate:
            return int(self.price * (self.qty / 100))
        return int(self.price * self.qty * self.freq)


class SpendingLimitRule(models.Model):
    subject = models.ForeignKey(BudgetSubject, on_delete=models.CASCADE, related_name='limit_rules')
    max_unit_price = models.BigIntegerField()
    unit = models.CharField(max_length=20)
    enforcement = models.CharField(max_length=10, choices=[('WARN', 'Warning'), ('BLOCK', 'Block')], default='WARN')
    note = models.CharField(max_length=255, null=True, blank=True)


class BudgetExecution(models.Model):
    entry = models.ForeignKey(BudgetEntry, on_delete=models.CASCADE, related_name='executions')
    executed_at = models.DateField()
    amount = models.BigIntegerField()
    description = models.CharField(max_length=255)
    document_no = models.CharField(max_length=100, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)


class BudgetTransfer(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    from_entry = models.ForeignKey(BudgetEntry, on_delete=models.PROTECT, related_name='transfers_out')
    to_entry = models.ForeignKey(BudgetEntry, on_delete=models.PROTECT, related_name='transfers_in')
    amount = models.BigIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True, related_name='approved_transfers')
    approved_at = models.DateTimeField(null=True, blank=True)
    reject_reason = models.TextField(null=True, blank=True)
    reason = models.TextField()
    evidence_file = models.FileField(upload_to='budget_evidence/%Y/%m/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)

    def clean(self):
        if self.from_entry == self.to_entry:
            raise ValidationError('Transfer from/to entry cannot be the same.')
        if self.amount <= 0:
            raise ValidationError('Transfer amount must be greater than 0.')


class ApprovalLog(models.Model):
    LOG_TYPE_CHOICES = [
        ('WORKFLOW', 'Workflow'),
        ('AUTH', 'Auth'),
        ('CRUD', 'CRUD'),
        ('SYSTEM', 'System'),
    ]

    entry = models.ForeignKey(BudgetEntry, on_delete=models.SET_NULL, null=True, blank=True, related_name='approval_logs')
    from_status = models.CharField(max_length=20, null=True, blank=True)
    to_status = models.CharField(max_length=20, null=True, blank=True)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approval_logs')
    log_type = models.CharField(max_length=20, choices=LOG_TYPE_CHOICES, default='WORKFLOW', db_index=True)
    action = models.CharField(max_length=50, default='STATUS_CHANGE', db_index=True)
    resource_type = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    resource_id = models.CharField(max_length=64, null=True, blank=True, db_index=True)
    method = models.CharField(max_length=10, null=True, blank=True)
    path = models.CharField(max_length=255, null=True, blank=True)
    status_code = models.PositiveIntegerField(null=True, blank=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    reason = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at', '-id']


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('STAFF', 'Staff'),       # 부서 담당자 (구 MANAGER): 본인 부서 편집
        ('MANAGER', 'Manager'),   # 총무팀 (구 REVIEWER): 전체 확인·편집
        ('ADMIN', 'Admin'),       # 시스템 전체
        ('ORG_VIEWER', 'Org Viewer'),
        # 하위 호환: 구 STAFF → STAFF, 구 REVIEWER → MANAGER, 구 REQUESTOR → STAFF
        ('REQUESTOR', 'Requestor'),  # 하위 호환용 (= STAFF 처리)
        ('REVIEWER', 'Reviewer'),    # 하위 호환용 (= MANAGER 처리)
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    team = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_users', verbose_name='소속 팀')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STAFF')


class SubmissionComment(models.Model):
    """
    예산 검토 의견 스레드.
    - 개별 항목(entry) 또는 예산 계층(subject+org+version) 단위로 의견 작성.
    - comment_type이 해당 목/항/관/장의 현재 상태(머릿말)가 됨.
    - 최신 top-level 의견의 type이 해당 항목의 상태를 나타냄.
    """
    COMMENT_TYPE_CHOICES = [
        ('DONE',     '작성완료'),   # STAFF: 작성 완료 표시
        ('REQUEST',  '수정요청'),   # MANAGER: 수정 요청
        ('QUESTION', '질문'),       # anyone
        ('ANSWER',   '답변'),       # anyone
    ]

    # 대상: 개별 목(entry) 또는 장·관·항(subject+org+version) — 둘 중 하나
    entry   = models.ForeignKey(BudgetEntry, on_delete=models.CASCADE,
                                null=True, blank=True, related_name='comments')
    # 장·관·항 단위 의견: subject + org + version 조합
    subject = models.ForeignKey(BudgetSubject, on_delete=models.CASCADE,
                                null=True, blank=True, related_name='comments')
    org     = models.ForeignKey(Organization, on_delete=models.CASCADE,
                                null=True, blank=True, related_name='submission_comments')
    version = models.ForeignKey(BudgetVersion, on_delete=models.CASCADE,
                                related_name='comments')
    entrusted_project = models.ForeignKey(EntrustedProject, on_delete=models.CASCADE,
                                null=True, blank=True, related_name='submission_comments')

    comment_type = models.CharField(max_length=20, choices=COMMENT_TYPE_CHOICES, default='DONE')
    body         = models.TextField()
    parent       = models.ForeignKey('self', on_delete=models.CASCADE,
                                     null=True, blank=True, related_name='replies')

    author     = models.ForeignKey(User, on_delete=models.PROTECT, related_name='submission_comments')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        target = f'entry#{self.entry_id}' if self.entry_id else f'org#{self.org_id}'
        return f'[{self.comment_type}] {target} by {self.author_id}'


class SupportingDocument(models.Model):
    """
    예산 근거자료 첨부파일.
    - 장·관·항·목 단위로 근거자료(사업계획서 등) 업로드.
    - subject + org + version + (entrusted_project) 조합으로 연결.
    """
    subject = models.ForeignKey(BudgetSubject, on_delete=models.CASCADE,
                                null=True, blank=True, related_name='supporting_documents')
    org     = models.ForeignKey(Organization, on_delete=models.CASCADE,
                                null=True, blank=True, related_name='supporting_documents')
    version = models.ForeignKey(BudgetVersion, on_delete=models.CASCADE,
                                related_name='supporting_documents')
    entrusted_project = models.ForeignKey(EntrustedProject, on_delete=models.CASCADE,
                                null=True, blank=True, related_name='supporting_documents')

    file = models.FileField(upload_to='supporting_docs/%Y/%m/')
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(default=0)

    author = models.ForeignKey(User, on_delete=models.PROTECT, related_name='supporting_documents')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.filename} ({self.subject.name if self.subject else 'Common'})"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


# Signals for automatic total updates
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=BudgetDetail)
@receiver(post_delete, sender=BudgetDetail)
def update_entry_totals_from_detail(sender, instance, **kwargs):
    if instance.entry:
        instance.entry.update_totals()

@receiver(post_save, sender=BudgetExecution)
@receiver(post_delete, sender=BudgetExecution)
def update_entry_totals_from_execution(sender, instance, **kwargs):
    if instance.entry:
        instance.entry.update_totals()
