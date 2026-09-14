import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { fetchCollectionPage } from '$lib/server/dataset-cache';
import type { Listing } from '../listings/+server';
import type { Rental } from '../rentals/+server';
import type { Project } from '../projects/+server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	try {
		const dataset = event.url.searchParams.get('dataset');
		const path =
			dataset === 'listings'
				? '/v1/listings'
				: dataset === 'rentals'
					? '/v1/rentals'
					: dataset === 'projects'
						? '/v1/projects'
						: null;
		if (!path) return json({ detail: 'Invalid insights dataset.' }, { status: 400 });
		const result =
			dataset === 'listings'
				? await fetchCollectionPage<Listing>(event, path, {}, Number(event.url.searchParams.get('offset') ?? 0))
				: dataset === 'rentals'
					? await fetchCollectionPage<Rental>(event, path, {}, Number(event.url.searchParams.get('offset') ?? 0))
					: await fetchCollectionPage<Project>(event, path, {}, Number(event.url.searchParams.get('offset') ?? 0));
		return json(result);
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
