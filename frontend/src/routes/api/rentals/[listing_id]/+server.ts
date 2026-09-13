import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { authenticatedRequest } from '$lib/server/authenticated-api';
import type { RequestHandler } from './$types';
import type { Rental } from '../+server';

export const GET: RequestHandler = async (event) => {
	try {
		const result = await authenticatedRequest<Rental>(
			event,
			`/v1/rentals/${encodeURIComponent(event.params.listing_id)}`
		);
		return json(result);
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
