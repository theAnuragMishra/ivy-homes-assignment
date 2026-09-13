import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { authenticatedRequest } from '$lib/server/authenticated-api';
import { withCorrectedAreas } from '$lib/server/listings';
import type { Listing } from '$lib/server/listings';
import type { RequestHandler } from './$types';

/**
 * The documented /v1/favourites routes (GET/POST/DELETE, POST body {"id":
 * ...}) all return 404. The live, working saved-listing API is
 * /v1/saved (GET/POST) and /v1/saved/{listing_id} (DELETE), and POST
 * requires a body of {"listing_id": ...} -- the documented {"id": ...}
 * shape returns 422.
 */
export const GET: RequestHandler = async (event) => {
	try {
		const result = await authenticatedRequest<{ count: number; results: Listing[] }>(
			event,
			'/v1/saved'
		);
		return json({ count: result.count, results: withCorrectedAreas(result.results) });
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json().catch(() => null);
	const listingId = body?.listing_id;
	if (typeof listingId !== 'string' || !listingId) {
		return json({ detail: 'listing_id is required.' }, { status: 400 });
	}

	try {
		const result = await authenticatedRequest<{ ok: boolean; saved_count: number }>(
			event,
			'/v1/saved',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ listing_id: listingId })
			}
		);
		return json(result);
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
