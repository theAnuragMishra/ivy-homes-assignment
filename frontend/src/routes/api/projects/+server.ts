import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { getFullCollection } from '$lib/server/dataset-cache';
import { filterProjects, sortProjects, withCorrectedPrices } from '$lib/server/projects';
import type { Project } from '$lib/server/projects';
import type { RequestHandler } from './$types';

export type { Project };

export type ProjectCollection = {
	limit: number;
	offset: number;
	count: number;
	total: number;
	has_more: boolean;
	results: Project[];
};

function numberParam(value: string | null): number | undefined {
	if (value === null || value === '') return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
}

export const GET: RequestHandler = async (event) => {
	const search = event.url.searchParams;

	try {
		const raw = await getFullCollection<Project>(event, '/v1/projects');
		const corrected = withCorrectedPrices(raw);

		const filtered = filterProjects(corrected, {
			locality: search.get('locality') ?? undefined,
			developer: search.get('developer') ?? undefined,
			projectStatus: search.get('project_status') ?? undefined,
			minPrice: numberParam(search.get('min_price')),
			maxPrice: numberParam(search.get('max_price')),
			minArea: numberParam(search.get('min_area')),
			maxArea: numberParam(search.get('max_area')),
			minUnits: numberParam(search.get('min_units')),
			maxUnits: numberParam(search.get('max_units')),
			minTowers: numberParam(search.get('min_towers')),
			maxTowers: numberParam(search.get('max_towers'))
		});

		const sorted = sortProjects(
			filtered,
			search.get('sort_by') ?? undefined,
			search.get('order') ?? undefined
		);

		const limit = Math.min(numberParam(search.get('limit')) ?? 24, 200);
		const offset = numberParam(search.get('offset')) ?? 0;
		const page = sorted.slice(offset, offset + limit);

		const result: ProjectCollection = {
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
