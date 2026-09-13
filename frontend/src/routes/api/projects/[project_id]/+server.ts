import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { authenticatedRequest } from '$lib/server/authenticated-api';
import { withCorrectedPrices } from '$lib/server/projects';
import type { Project } from '$lib/server/projects';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	try {
		const result = await authenticatedRequest<Project>(
			event,
			`/v1/projects/${encodeURIComponent(event.params.project_id)}`
		);
		return json(withCorrectedPrices([result])[0]);
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
