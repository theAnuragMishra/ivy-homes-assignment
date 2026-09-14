import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { authenticatedRequest } from '$lib/server/authenticated-api';
import { withCorrectedAreas } from '$lib/server/listings';
import type { Listing } from '$lib/server/listings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	try {
		const listing = await authenticatedRequest<Listing>(
			event,
			`/v1/listings/${encodeURIComponent(event.params.listing_id)}`
		);
		return json(withCorrectedAreas([listing])[0]);
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
