from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from api_client import IvyAPI, IvyAPIError


OUTPUT_DIR = Path("data")
COLLECTIONS = {
    "listings": "/v1/listings",
    "rentals": "/v1/rentals",
    "projects": "/v1/projects",
}


def write_json(path: Path, value: Any) -> None:
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + "\n")


def main() -> None:
    email = os.environ.get("DEMO_EMAIL")
    password = os.environ.get("DEMO_PASSWORD")
    if not email or not password:
        raise SystemExit(
            "Set DEMO_EMAIL and DEMO_PASSWORD in .env before running research.py."
        )

    OUTPUT_DIR.mkdir(exist_ok=True)
    with IvyAPI() as api:
        api.login(email, password)
        write_json(OUTPUT_DIR / "health.json", api.health())

        for name, endpoint in COLLECTIONS.items():
            records = list(api.iter_collection(endpoint))
            write_json(OUTPUT_DIR / f"{name}.json", records)
            print(f"{name}: {len(records)} records")

        print("The analytics endpoint documented in API_REFERENCE.md is probed separately.")
        try:
            analytics = api.get("/v1/analytics/summary")
        except IvyAPIError as exc:
            print(f"analytics: unavailable ({exc})")
        else:
            write_json(OUTPUT_DIR / "analytics.json", analytics)


if __name__ == "__main__":
    main()
