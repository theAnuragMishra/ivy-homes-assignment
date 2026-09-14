import type { RequestEvent } from '@sveltejs/kit';
import { authenticatedRequest, ensureAuthenticated } from '$lib/server/authenticated-api';

export const UPSTREAM_PAGE_SIZE = 30;

export type UpstreamCollection<T> = {
	results: T[];
	has_more: boolean;
	total?: number;
};

export async function fetchCollectionPage<T>(
	event: Pick<RequestEvent, 'fetch' | 'cookies'>,
	path: string,
	params: Record<string, string | number | undefined>,
	offset: number,
	limit = UPSTREAM_PAGE_SIZE
): Promise<UpstreamCollection<T>> {
	await ensureAuthenticated(event);
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== '') search.set(key, String(value));
	}
	search.set('limit', String(limit));
	search.set('offset', String(offset));
	return authenticatedRequest<UpstreamCollection<T>>(event, `${path}?${search}`);
}

export async function fetchUntilMatches<T>(
	event: Pick<RequestEvent, 'fetch' | 'cookies'>,
	path: string,
	params: Record<string, string | number | undefined>,
	targetCount: number,
	matches: (records: T[]) => T[],
	startOffset = 0
): Promise<{ records: T[]; hasMore: boolean; nextOffset: number }> {
	const records: T[] = [];
	let offset = startOffset;
	let hasMore = true;

	while (hasMore && matches(records).length < targetCount) {
		const page = await fetchCollectionPage<T>(event, path, params, offset);
		records.push(...page.results);
		hasMore = page.has_more && page.results.length > 0;
		offset += page.results.length;
	}

	return { records, hasMore, nextOffset: offset };
}
