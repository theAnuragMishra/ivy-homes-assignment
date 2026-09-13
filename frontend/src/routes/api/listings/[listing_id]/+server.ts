import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { getFullCollection } from '$lib/server/dataset-cache';
import { withCorrectedAreas } from '$lib/server/listings';
import type { Listing } from '$lib/server/listings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	try {
		const raw = await getFullCollection<Listing>(event, '/v1/listings');
		const listing = withCorrectedAreas(raw).find(
			(item) => item.listing_id === event.params.listing_id
		);
		if (!listing) {
			return json({ detail: 'No such listing in your city.' }, { status: 404 });
		}
		return json(listing);
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
