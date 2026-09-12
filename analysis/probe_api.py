from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from api_client import IvyAPI, IvyAPIError


def summarize(payload: Any) -> dict[str, Any]:
    if isinstance(payload, dict):
        results = payload.get("results")
        summary: dict[str, Any] = {
            key: payload[key]
            for key in ("limit", "offset", "count", "total", "has_more")
            if key in payload
        }
        if isinstance(results, list):
            summary["result_count"] = len(results)
            summary["first_id"] = results[0].get("listing_id") if results else None
            summary["last_id"] = results[-1].get("listing_id") if results else None
            if results:
                summary["first"] = results[0]
        return summary
    return {"type": type(payload).__name__}


def main() -> None:
    observations: dict[str, Any] = {}
    with IvyAPI() as api:
        api.login(os.environ["DEMO_EMAIL"], os.environ["DEMO_PASSWORD"])
        first_listing = api.request(
            "GET", "/v1/listings", params={"limit": 1, "offset": 0}
        )["results"][0]["listing_id"]

        probes = {
            "listings_default": ("/v1/listings", {"limit": 200, "offset": 0}),
            "listings_locality": (
                "/v1/listings",
                {"limit": 200, "offset": 0, "locality": "thoraipakkam"},
            ),
            "listings_bhk": (
                "/v1/listings",
                {"limit": 200, "offset": 0, "bhk": 2},
            ),
            "listings_furnishing": (
                "/v1/listings",
                {"limit": 200, "offset": 0, "furnishing": "fully-furnished"},
            ),
            "listings_is_live": (
                "/v1/listings",
                {"limit": 200, "offset": 0, "is_live": True},
            ),
            "listings_project": (
                "/v1/listings",
                {"limit": 200, "offset": 0, "project_id": "P40001"},
            ),
            "listings_sort_price": (
                "/v1/listings",
                {"limit": 10, "offset": 0, "sort_by": "price", "order": "asc"},
            ),
            "rentals_default": ("/v1/rentals", {"limit": 200, "offset": 0}),
            "projects_default": ("/v1/projects", {"limit": 200, "offset": 0}),
            "projects_sort_price_max": (
                "/v1/projects",
                {
                    "limit": 10,
                    "offset": 0,
                    "sort_by": "price_max",
                    "order": "desc",
                },
            ),
        }

        for name, (path, params) in probes.items():
            try:
                observations[name] = summarize(api.request("GET", path, params=params))
            except IvyAPIError as exc:
                observations[name] = {
                    "status_code": exc.status_code,
                    "detail": exc.detail,
                }

        for name, path in {
            "documented_listing_singular": f"/v1/listing/{first_listing}",
            "actual_listing_plural": f"/v1/listings/{first_listing}",
            "documented_similar": f"/v1/listings/{first_listing}/similar",
            "documented_analytics": "/v1/analytics/summary",
        }.items():
            try:
                observations[name] = summarize(api.request("GET", path))
            except IvyAPIError as exc:
                observations[name] = {
                    "status_code": exc.status_code,
                    "detail": exc.detail,
                }

    Path("data").mkdir(exist_ok=True)
    Path("data/api_probe.json").write_text(json.dumps(observations, indent=2) + "\n")
    print(json.dumps(observations, indent=2))


if __name__ == "__main__":
    main()
