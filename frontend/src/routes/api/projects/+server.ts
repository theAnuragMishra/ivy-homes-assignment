import { json } from '@sveltejs/kit';
import { IvyApiError } from '$lib/server/ivy-api';
import { fetchCollectionPage, fetchUntilMatches } from '$lib/server/dataset-cache';
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
	next_offset?: number;
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
		const upstreamFilters = {
			locality: search.get('locality') ?? undefined,
			project_status: search.get('project_status') ?? undefined,
			sort_by: search.get('sort_by') ?? undefined,
			order: search.get('order') ?? undefined
		};
		const localFilters = {
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
		};
		const limit = Math.min(numberParam(search.get('limit')) ?? 24, 200);
		const offset = numberParam(search.get('offset')) ?? 0;
		const needsLocalFiltering = [
			'developer',
			'min_price',
			'max_price',
			'min_area',
			'max_area',
			'min_units',
			'max_units',
			'min_towers',
			'max_towers'
		].some((key) => search.has(key));
		const matching = (records: Project[]) =>
			sortProjects(
				filterProjects(withCorrectedPrices(records), localFilters),
				search.get('sort_by') ?? undefined,
				search.get('order') ?? undefined
			);
		let sorted: Project[];
		let upstreamHasMore: boolean;
		let page: Project[];
		let nextOffset: number | undefined;
		if (needsLocalFiltering) {
			const result = await fetchUntilMatches(
				event,
				'/v1/projects',
				upstreamFilters,
				limit,
				matching,
				numberParam(search.get('scan_offset')) ?? 0
			);
			sorted = matching(result.records);
			upstreamHasMore = result.hasMore;
			page = sorted;
			nextOffset = result.nextOffset;
		} else {
			const result = await fetchCollectionPage<Project>(
				event,
				'/v1/projects',
				upstreamFilters,
				offset,
				limit
			);
			sorted = matching(result.results);
			upstreamHasMore = result.has_more;
			page = [...new Map(sorted.map((record) => [record.project_id, record])).values()];
		}

		const result: ProjectCollection = {
			limit,
			offset,
			count: page.length,
			total: needsLocalFiltering ? sorted.length : page.length,
			has_more: needsLocalFiltering
				? upstreamHasMore
				: upstreamHasMore,
			next_offset: nextOffset,
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
