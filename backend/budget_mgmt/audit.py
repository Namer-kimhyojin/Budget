import logging

from .models import ApprovalLog

logger = logging.getLogger(__name__)


def get_client_ip(request):
    if request is None:
        return None
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def write_audit_log(
    *,
    request=None,
    actor=None,
    entry=None,
    log_type='SYSTEM',
    action='EVENT',
    from_status=None,
    to_status=None,
    reason='',
    resource_type=None,
    resource_id=None,
    status_code=None,
    metadata=None,
):
    """Best-effort audit logging. Never raise to callers."""
    try:
        actor_obj = actor
        if actor_obj is None and request is not None:
            user = getattr(request, 'user', None)
            if getattr(user, 'is_authenticated', False):
                actor_obj = user

        path = request.path if request is not None else None
        method = request.method if request is not None else None
        user_agent = None
        if request is not None:
            user_agent = request.META.get('HTTP_USER_AGENT')
            if user_agent and len(user_agent) > 255:
                user_agent = user_agent[:255]

        payload = metadata if isinstance(metadata, dict) else {}

        ApprovalLog.objects.create(
            entry=entry,
            actor=actor_obj,
            log_type=log_type or 'SYSTEM',
            action=action or 'EVENT',
            from_status=from_status,
            to_status=to_status,
            reason=reason or '',
            resource_type=resource_type or None,
            resource_id=str(resource_id) if resource_id not in (None, '') else None,
            method=method,
            path=path,
            status_code=status_code,
            ip_address=get_client_ip(request),
            user_agent=user_agent,
            metadata=payload,
        )
    except Exception:
        logger.exception('write_audit_log failed')
