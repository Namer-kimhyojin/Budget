from rest_framework import serializers
from .models import (
    Organization, BudgetSubject, BudgetEntry, BudgetDetail,
    BudgetTransfer, ApprovalLog, Notification, UserProfile,
    SpendingLimitRule, BudgetExecution, BudgetVersion, EntrustedProject,
    SubmissionComment, SupportingDocument,
)

class SupportingDocumentSerializer(serializers.ModelSerializer):
    author_display = serializers.SerializerMethodField(read_only=True)
    file_display_size = serializers.SerializerMethodField(read_only=True)

    def get_author_display(self, obj):
        author = getattr(obj, 'author', None)
        if not author:
            return None
        return str(author.first_name or '').strip() or author.username

    def get_file_display_size(self, obj):
        size = obj.file_size
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.1f} MB"

    class Meta:
        model = SupportingDocument
        fields = [
            'id', 'subject', 'org', 'version', 'entrusted_project',
            'file', 'filename', 'file_size', 'file_display_size',
            'author', 'author_display', 'created_at'
        ]
        read_only_fields = ['author', 'created_at', 'file_size', 'filename']

from datetime import datetime

class OrganizationSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    class Meta:
        model = Organization
        fields = ['id', 'name', 'code', 'org_type', 'parent', 'parent_name', 'erpnext_cost_center', 'sort_order']

class BudgetVersionSerializer(serializers.ModelSerializer):
    source_version_name = serializers.SerializerMethodField(read_only=True)
    guidelines_file_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BudgetVersion
        fields = '__all__'

    def get_source_version_name(self, obj):
        if not obj.source_version_id:
            return None
        return f"{obj.source_version.year}년 {obj.source_version.name}"

    def get_guidelines_file_name(self, obj):
        if not obj.guidelines_file:
            return None
        return obj.guidelines_file.name.split('/')[-1]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['status'] = instance.computed_status
        return ret

class EntrustedProjectSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    source_project_name = serializers.SerializerMethodField(read_only=True)
    derived_count = serializers.SerializerMethodField(read_only=True)
    total_budget = serializers.IntegerField(read_only=True)
    total_executed = serializers.IntegerField(read_only=True)
    total_balance = serializers.IntegerField(read_only=True)

    class Meta:
        model = EntrustedProject
        fields = ['id', 'organization', 'organization_name', 'code', 'year', 'name',
                  'status', 'starts_on', 'ends_on',
                  'source_project', 'source_project_name', 'derived_count',
                  'total_budget', 'total_executed', 'total_balance']
        read_only_fields = ['code']

    def get_source_project_name(self, obj):
        if obj.source_project:
            return f"[{obj.source_project.year}] {obj.source_project.name}"
        return None

    def get_derived_count(self, obj):
        return obj.derived_projects.count()

class BudgetSubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetSubject
        fields = ['id', 'code', 'name', 'description', 'level', 'parent', 'subject_type', 'erpnext_account', 'sort_order']

class BudgetDetailSerializer(serializers.ModelSerializer):
    total_price = serializers.IntegerField(read_only=True)
    sort_order = serializers.IntegerField(required=False, default=0, min_value=0)
    currency_unit = serializers.CharField(required=False, default='\uC6D0', max_length=20)
    freq_unit = serializers.CharField(required=False, default='\uD68C', max_length=20)
    unit = serializers.CharField(required=False, default='\uC2DD', max_length=20)
    before_data = serializers.SerializerMethodField(read_only=True)
    after_data = serializers.SerializerMethodField(read_only=True)
    author_username = serializers.CharField(source='author.username', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    _updated_at = serializers.DateTimeField(write_only=True, required=False)

    class Meta:
        model = BudgetDetail
        fields = [
            'id',
            'entry',
            'name',
            'price',
            'qty',
            'freq',
            'currency_unit',
            'unit',
            'freq_unit',
            'sort_order',
            'total_price',
            'sub_label',
            'source',
            'organization',
            'before_data',
            'after_data',
            'author_username',
            'updated_by_username',
            'updated_at',
            '_updated_at',
        ]

    def create(self, validated_data):
        validated_data.pop('_updated_at', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop('_updated_at', None)
        return super().update(instance, validated_data)

    def get_before_data(self, obj):
        return obj.before_snapshot or None

    def get_after_data(self, obj):
        return {
            'detail_id': obj.id,
            'entry_id': obj.entry_id,
            'name': obj.name,
            'price': obj.price,
            'qty': obj.qty,
            'freq': obj.freq,
            'currency_unit': obj.currency_unit,
            'unit': obj.unit,
            'freq_unit': obj.freq_unit,
            'source': obj.source,
            'sub_label': obj.sub_label,
            'sort_order': obj.sort_order,
            'is_rate': obj.is_rate,
            'organization': obj.organization_id,
            'total_price': obj.total_price,
            'author_username': obj.author.username if obj.author else None,
            'updated_by_username': obj.updated_by.username if obj.updated_by else None,
        }

    def validate(self, attrs):
        # 1. Price/Qty non-negative (redundant with model clean but good for API)
        price = attrs.get('price')
        qty = attrs.get('qty')
        if price is not None and price < 0:
            raise serializers.ValidationError('단가는 0보다 작을 수 없습니다.')
        if qty is not None and qty < 0:
            raise serializers.ValidationError('수량은 0보다 작을 수 없습니다.')

        # 2. Link checking
        entry = attrs.get('entry') or (self.instance.entry if self.instance else None)
        if entry:
            if entry.status != 'DRAFT':
                raise serializers.ValidationError('확정되거나 상신된 예산은 수정할 수 없습니다.')
            
            # Check version status (automatic locking)
            version = BudgetVersion.objects.filter(year=entry.year, round=entry.supplemental_round).first()
            if version and version.computed_status in ('EXPIRED', 'CLOSED', 'CONFIRMED'):
                raise serializers.ValidationError('해당 회차는 현재 수정할 수 없는 상태(접수마감/마감/확정)입니다.')

        region_context = attrs.get('region_context')
        weather_context = attrs.get('weather_context')
        if (region_context or weather_context):
            # Partial update UX: validate only when source fields are provided in the same request.
            evidence_source_name = attrs.get('evidence_source_name')
            evidence_source_url = attrs.get('evidence_source_url')
            if evidence_source_name is not None and evidence_source_url is not None:
                if not evidence_source_name or not evidence_source_url:
                    raise serializers.ValidationError('지역/날씨 정보와 함께 입력되는 출처명/URL은 비워둘 수 없습니다.')
        return attrs

class BudgetEntrySerializer(serializers.ModelSerializer):
    details = BudgetDetailSerializer(many=True, read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    entrusted_project_name = serializers.CharField(source='entrusted_project.name', read_only=True)
    original_amount = serializers.IntegerField(source='last_year_amount', read_only=True)
    variance_amount = serializers.SerializerMethodField(read_only=True)
    total_amount = serializers.IntegerField(read_only=True)
    executed_total = serializers.IntegerField(read_only=True)
    remaining_amount = serializers.IntegerField(read_only=True)
    detail_count = serializers.SerializerMethodField(read_only=True)
    comment_count = serializers.SerializerMethodField(read_only=True)
    latest_comment_type = serializers.SerializerMethodField(read_only=True)
    unresolved_types = serializers.SerializerMethodField(read_only=True)
    submitted_at = serializers.SerializerMethodField(read_only=True)
    submitted_by = serializers.SerializerMethodField(read_only=True)
    submitted_by_display = serializers.SerializerMethodField(read_only=True)
    latest_action_at = serializers.SerializerMethodField(read_only=True)
    latest_action_by = serializers.SerializerMethodField(read_only=True)
    latest_action_by_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BudgetEntry
        fields = '__all__'
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=BudgetEntry.objects.all(),
                fields=('subject', 'organization', 'entrusted_project', 'year', 'supplemental_round'),
                message="이미 동일한 조건의 예산 과목이 존재합니다."
            )
        ]

    @staticmethod
    def _actor_display(actor):
        if not actor:
            return None
        display = str(actor.first_name or '').strip()
        return display or actor.username

    def _entry_log_meta(self, obj):
        cache = getattr(self, '_entry_log_meta_cache', None)
        if cache is None:
            cache = {}
            setattr(self, '_entry_log_meta_cache', cache)
        if obj.pk in cache:
            return cache[obj.pk]

        prefetched = getattr(obj, '_prefetched_objects_cache', {}) or {}
        logs = prefetched.get('approval_logs')
        if logs is None:
            logs = list(obj.approval_logs.select_related('actor').all())
        else:
            logs = list(logs)

        if logs:
            logs_desc = sorted(logs, key=lambda log: log.created_at or datetime.min, reverse=True)
            logs_asc = list(reversed(logs_desc))
            latest_log = logs_desc[0]
            submit_candidates = [log for log in logs_desc if log.to_status == 'PENDING']
            submit_log = submit_candidates[0] if submit_candidates else None
            if submit_log is None:
                transition_candidates = [
                    log for log in logs_asc
                    if (log.from_status == 'DRAFT' and log.to_status != 'DRAFT') or log.to_status == 'PENDING'
                ]
                submit_log = transition_candidates[0] if transition_candidates else logs_asc[0]
        else:
            latest_log = None
            submit_log = None

        details_rel = getattr(obj, 'details', None)
        detail_count = len(details_rel.all()) if hasattr(details_rel, 'all') else 0

        meta = {
            'latest_log': latest_log,
            'submit_log': submit_log,
            'detail_count': detail_count,
        }
        cache[obj.pk] = meta
        return meta

    def get_detail_count(self, obj):
        return self._entry_log_meta(obj)['detail_count']

    def get_comment_count(self, obj):
        prefetched = getattr(obj, '_prefetched_objects_cache', {}) or {}
        comments = prefetched.get('comments')
        if comments is None:
            return obj.comments.filter(is_deleted=False).count()
        return sum(1 for c in comments if not c.is_deleted)

    def get_latest_comment_type(self, obj):
        """최신 top-level 의견의 타입 → 목의 현재 상태 머릿말."""
        prefetched = getattr(obj, '_prefetched_objects_cache', {}) or {}
        comments = prefetched.get('comments')
        if comments is None:
            latest = obj.comments.filter(is_deleted=False, parent__isnull=True).order_by('-created_at').first()
            return latest.comment_type if latest else None
        top_level = [c for c in comments if not c.is_deleted and c.parent_id is None]
        if not top_level:
            return None
        latest = max(top_level, key=lambda c: c.created_at)
        return latest.comment_type

    def get_unresolved_types(self, obj):
        """미해소 의견 유형 목록 반환.
        - REQUEST 이후 DONE/ANSWER가 없으면 'REQUEST' 포함
        - QUESTION 이후 ANSWER/DONE이 없으면 'QUESTION' 포함
        """
        prefetched = getattr(obj, '_prefetched_objects_cache', {}) or {}
        comments_qs = prefetched.get('comments')
        
        if comments_qs is None:
            comments = list(obj.comments.filter(
                is_deleted=False,
                version__year=obj.year,
                version__round=obj.supplemental_round
            ))
        else:
            comments = [c for c in comments_qs if not c.is_deleted]
            
        comments.sort(key=lambda c: c.created_at, reverse=True)
        top_level = [c for c in comments if c.parent_id is None]
        
        result = []
        _resolve = {'DONE', 'ANSWER'}
        
        for check_type, resolvers in (('REQUEST', _resolve), ('QUESTION', _resolve)):
            for comment in top_level:
                ct = comment.comment_type
                if ct == check_type:
                    # 이 REQUEST/QUESTION의 답글로 해소되었는지 검사
                    specific_resolver = 'DONE' if check_type == 'REQUEST' else 'ANSWER'
                    has_reply = any(c.parent_id == comment.id and c.comment_type == specific_resolver for c in comments)
                    
                    if not has_reply:
                        # 해소되지 않은 최신 코멘트 발견
                        result.append(check_type)
                        break
                elif ct in resolvers:
                    # 최상위에 해소 의견이 먼저 등장 → 미해소 아님 (이전 모든 항목 해소)
                    break
        return result

    def get_submitted_at(self, obj):
        submit_log = self._entry_log_meta(obj)['submit_log']
        return submit_log.created_at if submit_log else None

    def get_submitted_by(self, obj):
        submit_log = self._entry_log_meta(obj)['submit_log']
        return submit_log.actor.username if submit_log and submit_log.actor else None

    def get_submitted_by_display(self, obj):
        submit_log = self._entry_log_meta(obj)['submit_log']
        return self._actor_display(submit_log.actor) if submit_log else None

    def get_latest_action_at(self, obj):
        latest_log = self._entry_log_meta(obj)['latest_log']
        return latest_log.created_at if latest_log else None

    def get_latest_action_by(self, obj):
        latest_log = self._entry_log_meta(obj)['latest_log']
        return latest_log.actor.username if latest_log and latest_log.actor else None

    def get_latest_action_by_display(self, obj):
        latest_log = self._entry_log_meta(obj)['latest_log']
        return self._actor_display(latest_log.actor) if latest_log else None

    def get_variance_amount(self, obj):
        total_amount = int(getattr(obj, 'total_amount', 0) or 0)
        original_amount = int(getattr(obj, 'last_year_amount', 0) or 0)
        return total_amount - original_amount

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        if not instance:
            return attrs

        if 'last_year_amount' not in attrs:
            return attrs

        incoming = int(attrs.get('last_year_amount') or 0)
        current = int(getattr(instance, 'last_year_amount', 0) or 0)
        if incoming == current:
            return attrs

        version = (
            BudgetVersion.objects
            .filter(year=instance.year, round=instance.supplemental_round)
            .only('creation_mode', 'source_version_id')
            .first()
        )
        is_transfer_round = bool(version and (
            str(version.creation_mode or '').upper() == 'TRANSFER' or version.source_version_id
        ))
        if is_transfer_round:
            raise serializers.ValidationError({
                'last_year_amount': 'Transfer imported entries must keep original baseline amount.'
            })

        return attrs

class BudgetTransferSerializer(serializers.ModelSerializer):
    from_entry_name = serializers.CharField(source='from_entry.subject.name', read_only=True)
    to_entry_name = serializers.CharField(source='to_entry.subject.name', read_only=True)
    class Meta:
        model = BudgetTransfer
        fields = '__all__'

class BudgetExecutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetExecution
        fields = '__all__'

class ApprovalLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.username', read_only=True)
    actor_display = serializers.SerializerMethodField(read_only=True)

    def get_actor_display(self, obj):
        actor = getattr(obj, 'actor', None)
        if not actor:
            return None
        display = str(actor.first_name or '').strip()
        return display or actor.username

    class Meta:
        model = ApprovalLog
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    org_name = serializers.CharField(source='organization.name', read_only=True)
    class Meta:
        model = UserProfile
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class SpendingLimitRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpendingLimitRule
        fields = '__all__'

class SubmissionCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)
    author_display = serializers.SerializerMethodField(read_only=True)
    replies = serializers.SerializerMethodField(read_only=True)
    can_edit = serializers.SerializerMethodField(read_only=True)

    def get_author_display(self, obj):
        author = getattr(obj, 'author', None)
        if not author:
            return None
        return str(author.first_name or '').strip() or author.username

    def get_replies(self, obj):
        if obj.parent_id is not None:
            return []
        children = [c for c in obj.replies.all() if not c.is_deleted]
        return SubmissionCommentSerializer(children, many=True, context=self.context).data

    def get_can_edit(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        return obj.author_id == request.user.id

    class Meta:
        model = SubmissionComment
        fields = [
            'id', 'entry', 'subject', 'org', 'version', 'entrusted_project', 'comment_type', 'body',
            'parent', 'author', 'author_name', 'author_display',
            'replies', 'can_edit', 'created_at', 'updated_at', 'is_deleted',
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']
