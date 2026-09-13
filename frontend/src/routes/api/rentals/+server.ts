import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { getFullCollection } from '$lib/server/dataset-cache';
import { filterRentals, sortRentals } from '$lib/server/rentals';
import type { Rental } from '$lib/server/rentals';
import type { RequestHandler } from './$types';

export type { Rental };

export type RentalCollection = {
	limit: number;
	offset: number;
	count: number;
	total: number;
	has_more: boolean;
	results: Rental[];
};

function numberParam(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

export const GET: RequestHandler = async (event) => {
	const search = event.url.searchParams;

	try {
		const raw = await getFullCollection<Rental>(event, '/v1/rentals');

		const filtered = filterRentals(raw, {
			locality: search.get('locality') ?? undefined,
			bedroom: numberParam(search.get('bhk')),
			propertyType: search.get('property_type') ?? undefined,
			furnishing: search.get('furnishing') ?? undefined,
			minPrice: numberParam(search.get('min_price')),
			maxPrice: numberParam(search.get('max_price')),
			isLive: search.has('is_live') ? search.get('is_live') === 'true' : undefined
		});

		const sorted = sortRentals(
			filtered,
			search.get('sort_by') ?? undefined,
			search.get('order') ?? undefined
		);

		const limit = Math.min(numberParam(search.get('limit')) ?? 24, 200);
		const offset = numberParam(search.get('offset')) ?? 0;
		const page = sorted.slice(offset, offset + limit);

		const result: RentalCollection = {
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
