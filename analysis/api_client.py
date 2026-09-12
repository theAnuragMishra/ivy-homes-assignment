"""Small api client speicifically designed for the Ivy Homes assignment API.
"""

from __future__ import annotations

import os
from collections.abc import Iterator, Mapping
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv(".env")

BASE_URL = os.environ["API_BASE_URL"].rstrip("/")
API_KEY = os.environ["API_KEY"]


class IvyAPIError(RuntimeError):
    """Raised when the API returns an unsuccessful response."""

    def __init__(self, response: httpx.Response) -> None:
        try:
            detail = response.json().get("detail", response.text)
        except ValueError:
            detail = response.text
        super().__init__(f"{response.request.method} {response.request.url} "
                         f"failed with {response.status_code}: {detail}")
        self.status_code = response.status_code
        self.detail = detail


class IvyAPI:
    """Authenticated synchronous client with explicit pagination helpers."""

    def __init__(
        self,
        *,
        base_url: str = BASE_URL,
        api_key: str = API_KEY,
        token: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        self._client = httpx.Client(
            base_url=base_url.rstrip("/"),
            headers={"X-API-Key": api_key},
            timeout=timeout,
        )
        self._token = token
        self._refresh_token: str | None = None
        self._refresh_url = "/auth/refresh"

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "IvyAPI":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def _headers(self) -> dict[str, str]:
        if self._token is None:
            return {}
        return {"Authorization": f"Bearer {self._token}"}

    def request(self, method: str, path: str, **kwargs: Any) -> Any:
        response = self._client.request(
            method,
            path,
            headers=self._headers(),
            **kwargs,
        )
        if response.is_error:
            raise IvyAPIError(response)
        return response.json()

    def health(self) -> Mapping[str, Any]:
        return self.request("GET", "/health")

    def login(self, email: str, password: str) -> Mapping[str, Any]:
        payload = self.request(
            "POST",
            "/auth/login",
            json={"email": email, "password": password},
        )
        self._token = payload["access_token"]
        self._refresh_token = payload.get("refresh_token")
        self._refresh_url = payload.get("refresh_url", "/auth/refresh")
        return payload

    def refresh(self) -> Mapping[str, Any]:
        if not getattr(self, "_refresh_token", None):
            raise RuntimeError("No refresh token is available; log in first.")
        payload = self.request(
            "POST",
            self._refresh_url,
            json={"refresh_token": self._refresh_token},
        )
        self._token = payload["access_token"]
        self._refresh_token = payload.get("refresh_token", self._refresh_token)
        return payload

    def logout(self) -> Any:
        return self.request("POST", "/auth/logout")

    def get(self, path: str, **params: Any) -> Any:
        return self.request("GET", path, params=params)

    def iter_collection(
        self,
        path: str,
        *,
        limit: int = 200,
        **filters: Any,
    ) -> Iterator[Mapping[str, Any]]:
        """Yield every record, following the API's offset pagination metadata."""
        offset = 0
        while True:
            params = {
                **filters,
                "limit": limit,
                "offset": offset,
            }
            payload = self.request("GET", path, params=params)
            batch = self._records_from(payload)
            yield from batch

            if not self._has_more(payload, batch, offset, limit):
                break
            offset += len(batch)
            if not batch:
                raise IvyAPIError(
                    httpx.Response(
                        status_code=500,
                        request=httpx.Request("GET", f"{BASE_URL}{path}"),
                    )
                )

    @staticmethod
    def _records_from(payload: Any) -> list[Mapping[str, Any]]:
        if isinstance(payload, list):
            return payload
        if not isinstance(payload, Mapping):
            raise TypeError(f"Expected collection object, got {type(payload)!r}")
        for key in ("data", "results", "items"):
            records = payload.get(key)
            if isinstance(records, list):
                return records
        raise KeyError(f"Could not find collection records in keys: {payload.keys()}")

    @staticmethod
    def _has_more(
        payload: Any,
        batch: list[Mapping[str, Any]],
        offset: int,
        limit: int,
    ) -> bool:
        if isinstance(payload, Mapping):
            for key in ("has_more", "hasMore", "more"):
                if key in payload:
                    return bool(payload[key])
            total = payload.get("total")
            if isinstance(total, int):
                return offset + len(batch) < total
            next_offset = payload.get("next_offset")
            if next_offset is not None:
                return next_offset is not None
        return len(batch) == limit


if __name__ == "__main__":
    with IvyAPI() as api:
        print(api.health())
