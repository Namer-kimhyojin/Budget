import json
from dataclasses import dataclass
import requests
from django.conf import settings


class ERPNextError(RuntimeError):
    def __init__(self, message, status_code=None, payload=None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload or {}


@dataclass
class ERPNextConfig:
    base_url: str
    api_key: str
    api_secret: str
    timeout: int = 15
    verify_tls: bool = True


class ERPNextClient:
    def __init__(self, config: ERPNextConfig):
        self.config = config

    def _headers(self):
        token = f"{self.config.api_key}:{self.config.api_secret}"
        return {
            "Authorization": f"token {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _request(self, method, path, params=None, json_body=None):
        url = f"{self.config.base_url}{path}"
        try:
            response = requests.request(
                method,
                url,
                headers=self._headers(),
                params=params,
                json=json_body,
                timeout=self.config.timeout,
                verify=self.config.verify_tls,
            )
        except requests.RequestException as exc:
            raise ERPNextError(
                f"ERPNext request failed: {exc.__class__.__name__}",
                payload={"detail": str(exc)},
            ) from exc
        try:
            payload = response.json()
        except ValueError:
            payload = {"raw": response.text}

        if response.status_code >= 400:
            message = payload.get("message") or payload.get("exc") or "ERPNext request failed"
            raise ERPNextError(message, status_code=response.status_code, payload=payload)

        return payload

    def get_logged_user(self):
        return self._request("GET", "/api/method/frappe.auth.get_logged_user")

    def list_resource(self, doctype, filters=None, fields=None, limit=20):
        params = {"limit_page_length": limit}
        if filters:
            params["filters"] = json.dumps(filters)
        if fields:
            params["fields"] = json.dumps(fields)
        return self._request("GET", f"/api/resource/{doctype}", params=params)

    def create_resource(self, doctype, data):
        return self._request("POST", f"/api/resource/{doctype}", json_body=data)

    def update_resource(self, doctype, name, data):
        return self._request("PUT", f"/api/resource/{doctype}/{name}", json_body=data)


def get_erpnext_client():
    config = ERPNextConfig(
        base_url=settings.ERPNEXT_BASE_URL,
        api_key=settings.ERPNEXT_API_KEY,
        api_secret=settings.ERPNEXT_API_SECRET,
        timeout=settings.ERPNEXT_TIMEOUT,
        verify_tls=settings.ERPNEXT_VERIFY_TLS,
    )
    if not config.base_url or not config.api_key or not config.api_secret:
        raise ERPNextError("ERPNext connection is not configured")
    return ERPNextClient(config)
