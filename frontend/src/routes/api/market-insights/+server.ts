import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { getFullCollection } from '$lib/server/dataset-cache';
import { calculateMarketInsights } from '$lib/server/market-insights';
import type { Listing } from '../listings/+server';
import type { Rental } from '../rentals/+server';
import type { Project } from '../projects/+server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	try {
		const [listings, rentals, projects] = await Promise.all([
			getFullCollection<Listing>(event, '/v1/listings'),
			getFullCollection<Rental>(event, '/v1/rentals'),
			getFullCollection<Project>(event, '/v1/projects')
		]);
		return json(calculateMarketInsights(listings, rentals, projects));
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
