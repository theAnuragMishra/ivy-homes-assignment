import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { getFullCollection } from '$lib/server/dataset-cache';
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
	results: Listing[];
};

function numberParam(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * This route deliberately does NOT forward filter parameters to the
 * upstream /v1/listings request. The live API accepts furnishing, is_live,
 * project_id, min_price, and max_price but silently ignores every one of
 * them (verified: filtered and unfiltered requests return byte-identical
 * records). Instead, the full listing collection is pulled once per server
 * process (dataset-cache.ts) and every filter, the magichomes sqm/sqft unit
 * fix, sorting, and pagination are all applied locally here, so filters
 * work correctly regardless of what the upstream API does with them.
 */
export const GET: RequestHandler = async (event) => {
	const search = event.url.searchParams;

	try {
		const raw = await getFullCollection<Listing>(event, '/v1/listings');
		const corrected = withCorrectedAreas(raw);

		const filtered = filterListings(corrected, {
			locality: search.get('locality') ?? undefined,
			bedroom: numberParam(search.get('bhk')),
			propertyType: search.get('property_type') ?? undefined,
			furnishing: search.get('furnishing') ?? undefined,
			minPrice: numberParam(search.get('min_price')),
			maxPrice: numberParam(search.get('max_price')),
			isLive: search.has('is_live') ? search.get('is_live') === 'true' : undefined,
			projectId: search.get('project_id') ?? undefined
		});

		const sorted = sortListings(filtered, search.get('sort_by') ?? undefined, search.get('order') ?? undefined);

		const limit = Math.min(numberParam(search.get('limit')) ?? 24, 200);
		const offset = numberParam(search.get('offset')) ?? 0;
		const page = sorted.slice(offset, offset + limit);

		const result: ListingCollection = {
			limit,
			offset,
			count: page.length,
			total: sorted.length,
			has_more: offset + page.length < sorted.length,
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
