"""
Undercore API — Python SDK client
Phase 125 — undercore-sdk v1.0.0

Thin httpx-based wrapper over the Undercore REST API.

Usage:
    from undercore import Undercore

    # Context manager (recommended)
    with Undercore(api_key="uc_live_...") as uc:
        result = uc.works.list(page=1, per_page=50)
        for work in result.works:
            print(work.title, work.status)

    # Manual lifecycle
    uc = Undercore(api_key="uc_live_...")
    try:
        result = uc.writers.list()
    finally:
        uc.close()

Ley #10.7: CERO mention of "Undercore Publishing", "Luzonic Holdings",
or "powered by" in SDK. This package documents the Undercore API (tech product).
"""

from __future__ import annotations

from typing import Any, Dict, Optional

import httpx

from .types import Work, Writer, WorksResponse, WritersResponse

# ── Default configuration ──────────────────────────────────────

_DEFAULT_BASE_URL = "https://api.undercore.pro"
_DEFAULT_TIMEOUT = 30.0  # seconds


# ── Error ──────────────────────────────────────────────────────


class UndercoreError(Exception):
    """Raised when the Undercore API returns a non-2xx HTTP response.

    Attributes:
        status (int): HTTP status code (e.g. 401, 403, 404, 429).
        detail (str): Human-readable error message from the API.

    Example:
        try:
            work = uc.works.get(99999)
        except UndercoreError as e:
            print(e.status)   # 404
            print(e.detail)   # "Obra no encontrada"
    """

    def __init__(self, status: int, detail: str) -> None:
        super().__init__(f"Undercore API error {status}: {detail}")
        self.status = status
        self.detail = detail


# ── Resource classes ───────────────────────────────────────────


class _WorksResource:
    """Methods for the /v1/works endpoints.

    Scope required: read:works
    """

    def __init__(self, client: "Undercore") -> None:
        self._client = client

    def list(self, page: int = 1, per_page: int = 50) -> WorksResponse:
        """List works for your tenant (paginated).

        Args:
            page:     Page number (1-indexed). Default: 1.
            per_page: Items per page (max 200). Default: 50.

        Returns:
            WorksResponse with works list, page, per_page, and total.
        """
        data = self._client._request(
            "GET",
            "/v1/works",
            params={"page": page, "per_page": per_page},
        )
        return WorksResponse._from_dict(data)

    def get(self, work_id: int) -> Work:
        """Get a single work by its numeric ID.

        Args:
            work_id: The integer work ID.

        Returns:
            Work dataclass.

        Raises:
            UndercoreError: 404 if the work does not exist in your tenant.
        """
        data = self._client._request("GET", f"/v1/works/{work_id}")
        return Work._from_dict(data["work"])


class _WritersResource:
    """Methods for the /v1/writers endpoints.

    Scope required: read:writers
    """

    def __init__(self, client: "Undercore") -> None:
        self._client = client

    def list(self, page: int = 1, per_page: int = 50) -> WritersResponse:
        """List writers for your tenant (paginated, ordered by name).

        Args:
            page:     Page number (1-indexed). Default: 1.
            per_page: Items per page (max 200). Default: 50.

        Returns:
            WritersResponse with writers list, page, per_page, and total.
        """
        data = self._client._request(
            "GET",
            "/v1/writers",
            params={"page": page, "per_page": per_page},
        )
        return WritersResponse._from_dict(data)

    def get(self, writer_id: int) -> Writer:
        """Get a single writer by their numeric ID.

        Args:
            writer_id: The integer writer ID.

        Returns:
            Writer dataclass.

        Raises:
            UndercoreError: 404 if the writer does not exist in your tenant.
        """
        data = self._client._request("GET", f"/v1/writers/{writer_id}")
        return Writer._from_dict(data["writer"])


# ── Main client ────────────────────────────────────────────────


class Undercore:
    """Undercore API client.

    Thin wrapper over httpx.Client. Handles authentication, request
    routing, and error parsing. Thread-safe for concurrent use.

    Args:
        api_key:  Your API key from portal.undercore.pro/settings/api-keys.
        base_url: Base URL override. Default: https://api.undercore.pro
        timeout:  Request timeout in seconds. Default: 30.0

    Example:
        # Context manager (recommended — auto-closes HTTP connection)
        with Undercore(api_key="uc_live_...") as uc:
            result = uc.works.list(page=1, per_page=25)
            for work in result.works:
                print(work.title, work.status)

        # Manual lifecycle
        uc = Undercore(api_key="uc_sandbox_...")
        writers = uc.writers.list()
        uc.close()

    Attributes:
        works:   _WorksResource — access /v1/works endpoints.
        writers: _WritersResource — access /v1/writers endpoints.
    """

    def __init__(
        self,
        api_key: str,
        base_url: str = _DEFAULT_BASE_URL,
        timeout: float = _DEFAULT_TIMEOUT,
    ) -> None:
        if not api_key or not api_key.strip():
            raise ValueError("Undercore SDK: api_key is required")

        self._api_key = api_key.strip()
        self._base_url = base_url.rstrip("/")

        # T-125-04: API key in header, never in URL
        # T-125-06: key is not logged by httpx event hooks
        self._client = httpx.Client(
            base_url=self._base_url,
            headers={
                "X-API-Key": self._api_key,
                "Accept": "application/json",
                "User-Agent": "undercore-sdk/1.0.0 python-httpx",
            },
            timeout=timeout,
        )

        self.works = _WorksResource(self)
        self.writers = _WritersResource(self)

    def catalog(self) -> Dict[str, Any]:
        """Get the API catalog — lists available v1 endpoints for your key.

        Returns:
            dict with service, version, tenant, scopes, endpoints, rate_limits.
        """
        return self._request("GET", "/v1/")

    def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Low-level HTTP request method.

        Handles response parsing and error translation to UndercoreError.

        Args:
            method: HTTP method ("GET", "POST", etc.)
            path:   API path (e.g. "/v1/works")
            params: Optional query parameters dict.

        Returns:
            Parsed JSON response as a dict.

        Raises:
            UndercoreError: on non-2xx HTTP responses.
            httpx.TimeoutException: on request timeout.
            httpx.NetworkError: on connection failures.
        """
        response = self._client.request(method, path, params=params)

        if response.status_code >= 400:
            detail = f"HTTP {response.status_code}"
            try:
                body = response.json()
                detail = body.get("detail", detail)
            except Exception:
                detail = response.text or detail

            raise UndercoreError(status=response.status_code, detail=detail)

        return response.json()  # type: ignore[no-any-return]

    def close(self) -> None:
        """Close the underlying HTTP connection pool.

        Called automatically when using the context manager.
        """
        self._client.close()

    def __enter__(self) -> "Undercore":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()
