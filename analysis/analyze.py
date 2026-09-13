from __future__ import annotations

import json
import itertools
import math
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any


DATA_DIR = Path("data")
REFERENCE = datetime(2026, 9, 10, tzinfo=timezone(timedelta(hours=5, minutes=30)))
WINDOW_START = REFERENCE - timedelta(days=7)
ASSIGNED_LOCALITY = "thoraipakkam"
SQFT_PER_SQM = Decimal("10.7639")


def load(name: str) -> list[dict[str, Any]]:
    with (DATA_DIR / f"{name}.json").open() as file:
        return json.load(file)


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        # /v1/listings posted_at is always naive (no Z / offset), unlike
        # /v1/rentals which always carries a Z suffix. The health endpoint
        # reports the server timezone as Asia/Kolkata with an explicit
        # +05:30 offset, and the naive listing timestamps line up on clean
        # IST calendar-day boundaries (see document.md section 9), so naive
        # values are interpreted here as IST.
        parsed = parsed.replace(tzinfo=REFERENCE.tzinfo)
    return parsed


def quantize(value: Decimal) -> float:
    return float(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def find_area_unit_bug(listings: list[dict[str, Any]]) -> set[str]:
    """Identify magichomes listings whose carpet/super areas are in square
    metres instead of square feet.

    Every other source website (100acres, dwelling, squarelane, zerobroker)
    reports carpet_area on a consistent square-foot scale for every bedroom
    count. About 40% of magichomes records report a carpet_area 5-10x smaller
    than any legitimate square-foot record with the same bedroom count (and
    the same property_type for plots) -- but the super_built_up/carpet_area
    ratio for those small records is identical to the ratio seen elsewhere
    (~1.33x), and multiplying them by the sqm->sqft conversion factor lands
    them back in the normal range. That is a unit bug, not corruption.
    """
    other = [item for item in listings if item["website"] != "magichomes"]
    minimums: defaultdict[tuple[int, bool], int] = defaultdict(lambda: 10**9)
    for item in other:
        key = (item["bedroom"], item["property_type"] == "plot")
        minimums[key] = min(minimums[key], item["carpet_area"])

    flagged: set[str] = set()
    for item in listings:
        if item["website"] != "magichomes":
            continue
        key = (item["bedroom"], item["property_type"] == "plot")
        minimum = minimums.get(key)
        if minimum is not None and item["carpet_area"] < minimum / 2:
            flagged.add(item["listing_id"])
    return flagged


def fixed_carpet_area(item: dict[str, Any], sqm_bug_ids: set[str]) -> Decimal:
    area = Decimal(item["carpet_area"])
    if item["listing_id"] in sqm_bug_ids:
        area *= SQFT_PER_SQM
    return area


def property_identity_counts(listings: list[dict[str, Any]]) -> dict[str, int]:
    identities = {
        "listing_id": len({item["listing_id"] for item in listings}),
        "apartment_locality": len(
            {(item["apartment_name"], item["locality"]) for item in listings}
        ),
        "coordinates": len(
            {(item["latitude"], item["longitude"]) for item in listings}
        ),
        "name_locality_bedroom_area": len(
            {
                (
                    item["apartment_name"],
                    item["locality"],
                    item["bedroom"],
                    item["carpet_area"],
                )
                for item in listings
            }
        ),
    }
    return identities


def duplicate_property_clusters(
    listings: list[dict[str, Any]],
    sqm_bug_ids: set[str],
) -> list[list[str]]:
    """Group cross-source records that describe the same apparent property.

    The stable, hard-to-fake attributes must match exactly. Area (after
    correcting the magichomes sqm bug) and coordinates must be almost
    identical, because two independently-generated properties essentially
    never coincide that closely by chance. Price is deliberately NOT used as
    a matching criterion: several genuine duplicate pairs differ in price by
    up to ~60% while still matching on every categorical field, on area to
    within ~1.6%, and on coordinates to within ~90m, which is far tighter
    than chance would produce. Price looks like independently-noisy listing
    data for the same underlying unit, not a signal of non-identity.
    """
    stable_fields = (
        "apartment_name",
        "locality",
        "property_type",
        "bedroom",
        "bathroom",
        "floor",
        "total_floors",
        "furnishing",
        "facing_direction",
        "covered_parking",
        "balcony",
    )
    groups: defaultdict[tuple[Any, ...], list[dict[str, Any]]] = defaultdict(list)
    for item in listings:
        groups[tuple(item[field] for field in stable_fields)].append(item)

    parent = {item["listing_id"]: item["listing_id"] for item in listings}

    def find(identifier: str) -> str:
        while parent[identifier] != identifier:
            parent[identifier] = parent[parent[identifier]]
            identifier = parent[identifier]
        return identifier

    def union(left: str, right: str) -> None:
        left_root, right_root = find(left), find(right)
        if left_root != right_root:
            parent[right_root] = left_root

    for records in groups.values():
        for left, right in itertools.combinations(records, 2):
            left_area = fixed_carpet_area(left, sqm_bug_ids)
            right_area = fixed_carpet_area(right, sqm_bug_ids)
            area_delta = abs(left_area - right_area) / max(left_area, right_area)
            coordinate_delta = math.dist(
                (left["latitude"], left["longitude"]),
                (right["latitude"], right["longitude"]),
            )
            if area_delta <= Decimal("0.02") and coordinate_delta <= 0.001:
                union(left["listing_id"], right["listing_id"])

    clusters: defaultdict[str, list[str]] = defaultdict(list)
    for item in listings:
        clusters[find(item["listing_id"])].append(item["listing_id"])
    return sorted(
        (sorted(cluster) for cluster in clusters.values() if len(cluster) > 1),
        key=lambda cluster: cluster[0],
    )


def suspicious_listing_groups(
    listings: list[dict[str, Any]],
) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = {}

    groups["negative_price"] = sorted(
        item["listing_id"] for item in listings if item["price"] <= 0
    )
    groups["floor_above_total_floors"] = sorted(
        item["listing_id"] for item in listings if item["floor"] > item["total_floors"]
    )
    groups["zero_bedroom_non_plot"] = sorted(
        item["listing_id"]
        for item in listings
        if item["bedroom"] == 0 and item["property_type"] != "plot"
    )
    groups["area_inversion"] = sorted(
        item["listing_id"]
        for item in listings
        if item["super_built_up_area"] < item["carpet_area"]
    )
    groups["invalid_coordinates"] = sorted(
        item["listing_id"]
        for item in listings
        if not (12 <= item["latitude"] <= 14 and 80 <= item["longitude"] <= 81)
    )

    by_coordinates: defaultdict[tuple[float, float], list[str]] = defaultdict(list)
    for item in listings:
        by_coordinates[(item["latitude"], item["longitude"])].append(item["listing_id"])
    groups["repeated_coordinates"] = sorted(
        listing_id
        for ids in by_coordinates.values()
        if len(ids) > 1
        for listing_id in ids
    )
    groups["low_price_bait"] = sorted(
        item["listing_id"] for item in listings if 0 < item["price"] < 100_000
    )
    return groups


def project_price_inr(project: dict[str, Any]) -> int:
    """Convert a project's price_min/price_max to rupees.

    price_min and price_max are each independently encoded: values under 10
    are already in crores, values 10 and over are in lakhs. This is visible
    from a clean gap in the raw data (every raw value is either <= 3.78 or
    >= 70.2, nothing in between) and is confirmed by the live API itself: the
    server's own `sort_by=price_max` ordering only makes sense if it sorts on
    this exact per-field conversion (e.g. a raw 70.2 -- 70.2 lakh = 0.702
    crore -- sorts as *smaller* than a raw 1.01, i.e. 1.01 crore). After this
    conversion, zero projects have price_min > price_max, versus dozens of
    apparent violations under a naive same-unit reading.
    """

    def convert(value: float) -> int:
        return int(round(value * 10_000_000 if value < 10 else value * 100_000))

    return convert(project["price_max"])


def project_price_min_inr(project: dict[str, Any]) -> int:
    def convert(value: float) -> int:
        return int(round(value * 10_000_000 if value < 10 else value * 100_000))

    return convert(project["price_min"])


def main() -> None:
    listings = load("listings")
    rentals = load("rentals")
    projects = load("projects")

    sqm_bug_ids = find_area_unit_bug(listings)

    corrupt_candidates = suspicious_listing_groups(listings)
    corrupt_categories = (
        "negative_price",
        "floor_above_total_floors",
        "zero_bedroom_non_plot",
        "area_inversion",
        "invalid_coordinates",
    )
    corrupt_union = sorted(
        {
            listing_id
            for category in corrupt_categories
            for listing_id in corrupt_candidates[category]
        }
    )
    fake_listing_ids = suspicious_listing_groups(listings)["low_price_bait"]
    excluded_listing_ids = set(corrupt_union) | set(fake_listing_ids)

    live_2bhk = [
        item for item in listings if item["is_live"] is True and item["bedroom"] == 2
    ]
    live_2bhk_prices = [
        Decimal(item["price"]) / fixed_carpet_area(item, sqm_bug_ids)
        for item in live_2bhk
        if item["listing_id"] not in excluded_listing_ids
    ]

    locality_rentals = [
        item for item in rentals if item["locality"].lower() == ASSIGNED_LOCALITY
    ]
    recent_listings = [
        item["listing_id"]
        for item in listings
        if WINDOW_START <= parse_timestamp(item["posted_at"]) < REFERENCE
    ]

    project_listing_counts_live: Counter[str] = Counter(
        item["project_id"]
        for item in listings
        if item["project_id"] is not None and item["is_live"] is True
    )
    project_listing_counts_all: Counter[str] = Counter(
        item["project_id"] for item in listings if item["project_id"] is not None
    )
    project_mismatches_all = sorted(
        project["project_id"]
        for project in projects
        if project["total_listings"] != project_listing_counts_all[project["project_id"]]
    )
    project_mismatches_live = sorted(
        project["project_id"]
        for project in projects
        if project["total_listings"] != project_listing_counts_live[project["project_id"]]
    )

    by_project_price = max(projects, key=project_price_inr)
    costliest_project_price_inr = project_price_inr(by_project_price)

    price_inversions_naive = sum(
        1 for p in projects if p["price_max"] < p["price_min"]
    )
    price_inversions_after_fix = sum(
        1
        for p in projects
        if project_price_inr(p) < project_price_min_inr(p)
    )

    duplicate_clusters = duplicate_property_clusters(listings, sqm_bug_ids)
    output = {
        "dataset_counts": {
            "listings": len(listings),
            "rentals": len(rentals),
            "projects": len(projects),
        },
        "direct_answers": {
            "total_listing_records": len(listings),
            "active_listings": sum(item["is_live"] is True for item in listings),
            "total_monthly_rent_assigned_locality": sum(
                item["price"] for item in locality_rentals
            ),
            "avg_price_per_sqft_2bhk_excluding_corrupt_and_fake": quantize(
                sum(live_2bhk_prices, Decimal(0)) / len(live_2bhk_prices)
            ),
            "listings_last_7_days": len(recent_listings),
            "costliest_project_raw": {
                "project_id": by_project_price["project_id"],
                "price_max": by_project_price["price_max"],
            },
            "costliest_project_inr_candidate": {
                "project_id": by_project_price["project_id"],
                "price_max_inr": costliest_project_price_inr,
            },
        },
        "area_unit_bug": {
            "affected_website": "magichomes",
            "affected_listing_count": len(sqm_bug_ids),
            "sample_ids": sorted(sqm_bug_ids)[:20],
        },
        "project_price_unit_check": {
            "apparent_inversions_if_same_unit": price_inversions_naive,
            "inversions_after_per_field_lakh_crore_fix": price_inversions_after_fix,
        },
        "property_identity_hypotheses": {
            **property_identity_counts(listings),
            "near_duplicate_clusters": len(duplicate_clusters),
            "near_duplicate_records_removed": sum(
                len(cluster) - 1 for cluster in duplicate_clusters
            ),
            "near_duplicate_unique_properties": len(listings)
            - sum(len(cluster) - 1 for cluster in duplicate_clusters),
            "near_duplicate_clusters_sample": duplicate_clusters[:20],
        },
        "corrupt_listing_candidates": corrupt_candidates,
        "corrupt_union_candidate": corrupt_union,
        "fake_listing_ids_candidate": fake_listing_ids,
        "fake_listing_investigation": {
            "unverified_count": sum(item["is_verified"] is False for item in listings),
            "repeated_contact_groups": sum(
                count > 1
                for count in Counter(
                    item["posted_by_contact"] for item in listings
                ).values()
            ),
            "recent_listing_ids": sorted(recent_listings),
        },
        "project_consistency_hypotheses": {
            "mismatch_count_using_all_records": len(project_mismatches_all),
            "mismatch_count_using_live_records": len(project_mismatches_live),
            "all_record_mismatches": project_mismatches_all,
            "live_record_mismatches": project_mismatches_live,
        },
    }

    DATA_DIR.mkdir(exist_ok=True)
    (DATA_DIR / "analysis.json").write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
