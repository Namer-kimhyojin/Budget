import re

from .audit import write_audit_log


MUTATING_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}
SKIP_PREFIXES = (
    '/api/logs/',
    '/api/auth/',
)
SKIP_EXACT = {
    '/api/entries/workflow/',
}
SKIP_ENTRY_ACTION_RE = re.compile(r'^/api/entries/\d+/(submit|approve|reject|reopen|recall|note)/$')


class ApiAuditLogMiddleware:
    """Request-level audit logging for mutating API calls."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        self._log_if_needed(request, response)
        return response

    def _log_if_needed(self, request, response):
        method = (request.method or '').upper()
        path = request.path or ''

        if method not in MUTATING_METHODS:
            return
        if not path.startswith('/api/'):
            return
        if any(path.startswith(prefix) for prefix in SKIP_PREFIXES):
            return
        if path in SKIP_EXACT:
            return
        if SKIP_ENTRY_ACTION_RE.match(path):
            return

        resource_type, resource_id = self._resource_from_path(path)
        action = self._action_from_request(method, resource_id)

        log_type = 'CRUD' if action in ('CREATE', 'UPDATE', 'DELETE') else 'SYSTEM'
        reason = f'{action} {resource_type or "api"}'

        write_audit_log(
            request=request,
            log_type=log_type,
            action=action,
            from_status='API',
            to_status=action,
            reason=reason,
            resource_type=resource_type,
            resource_id=resource_id,
            status_code=getattr(response, 'status_code', None),
            metadata={
                'ok': bool(getattr(response, 'status_code', 500) < 400),
            },
        )

    @staticmethod
    def _resource_from_path(path):
        parts = [p for p in path.strip('/').split('/') if p]
        # expected: /api/{resource}/ or /api/{resource}/{id}/...
        resource_type = parts[1] if len(parts) > 1 else None
        resource_id = None
        if len(parts) > 2 and parts[2].isdigit():
            resource_id = parts[2]
        return resource_type, resource_id

    @staticmethod
    def _action_from_request(method, resource_id):
        if method == 'DELETE':
            return 'DELETE'
        if method in ('PUT', 'PATCH'):
            return 'UPDATE'
        if method == 'POST':
            return 'CREATE' if resource_id is None else 'ACTION'
        return method
