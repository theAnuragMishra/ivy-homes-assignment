import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { authenticatedRequest } from '$lib/server/authenticated-api';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (event) => {
	try {
		const result = await authenticatedRequest<{ ok: boolean; saved_count: number }>(
			event,
			`/v1/saved/${encodeURIComponent(event.params.listing_id)}`,
			{ method: 'DELETE' }
		);
		return json(result);
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
