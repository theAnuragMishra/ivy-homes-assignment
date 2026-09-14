import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { fetchCollectionPage, fetchUntilMatches } from '$lib/server/dataset-cache';
import { filterListings, sortListings, withCorrectedAreas } from '$lib/server/listings';
import type { Listing } from '$lib/server/listings';
import type { RequestHandler } from './$types';

export type { Listing };

export type ListingCollection = {
	limit: number;
	offset: number;
	count: number;
	total: number;
	has_more: boolean;
	next_offset?: number;
	results: Listing[];
};

function numberParam(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

export const GET: RequestHandler = async (event) => {
	const search = event.url.searchParams;

	try {
		const upstreamFilters = {
			locality: search.get('locality') ?? undefined,
			bhk: numberParam(search.get('bhk')),
			property_type: search.get('property_type') ?? undefined,
			sort_by: search.get('sort_by') ?? undefined,
			order: search.get('order') ?? undefined
		};
		const localFilters = {
			locality: search.get('locality') ?? undefined,
			bedroom: numberParam(search.get('bhk')),
			propertyType: search.get('property_type') ?? undefined,
			furnishing: search.get('furnishing') ?? undefined,
			minPrice: numberParam(search.get('min_price')),
			maxPrice: numberParam(search.get('max_price')),
			isLive: search.has('is_live') ? search.get('is_live') === 'true' : undefined,
			projectId: search.get('project_id') ?? undefined
		};
		const limit = Math.min(numberParam(search.get('limit')) ?? 24, 200);
		const offset = numberParam(search.get('offset')) ?? 0;
		const needsLocalFiltering = ['furnishing', 'min_price', 'max_price', 'is_live', 'project_id'].some(
			(key) => search.has(key)
		);
		const matching = (records: Listing[]) =>
			sortListings(
				filterListings(withCorrectedAreas(records), localFilters),
				search.get('sort_by') ?? undefined,
				search.get('order') ?? undefined
			);
		let sorted: Listing[];
		let upstreamHasMore: boolean;
		let page: Listing[];
		let nextOffset: number | undefined;
		if (needsLocalFiltering) {
			const result = await fetchUntilMatches(
				event,
				'/v1/listings',
				upstreamFilters,
				limit,
				matching,
				numberParam(search.get('scan_offset')) ?? 0
			);
			sorted = matching(result.records);
			upstreamHasMore = result.hasMore;
			page = sorted;
			nextOffset = result.nextOffset;
		} else {
			const result = await fetchCollectionPage<Listing>(
				event,
				'/v1/listings',
				upstreamFilters,
				offset,
				limit
			);
			sorted = matching(result.results);
			upstreamHasMore = result.has_more;
			page = [...new Map(sorted.map((record) => [record.listing_id, record])).values()];
		}

		const result: ListingCollection = {
			limit,
			offset,
			count: page.length,
			total: needsLocalFiltering ? sorted.length : page.length,
			has_more: needsLocalFiltering
				? upstreamHasMore
				: upstreamHasMore,
			next_offset: nextOffset,
			results: page
		};
		return json(result);
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
