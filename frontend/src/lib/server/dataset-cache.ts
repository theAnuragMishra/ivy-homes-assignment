import type { RequestEvent } from '@sveltejs/kit';
import { authenticatedRequest, ensureAuthenticated } from '$lib/server/authenticated-api';

export const UPSTREAM_PAGE_SIZE = 30;
const FULL_COLLECTION_CACHE_TTL_MS = 5 * 60 * 1000;
const fullCollectionCache = new Map<
	string,
	{ data: unknown[]; fetchedAt: number; promise?: Promise<unknown[]> }
>();

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

// Aggregate views are the one consumer that intentionally needs the complete
// collection; browse routes use fetchUntilMatches instead.
export async function getFullCollection<T>(
	event: Pick<RequestEvent, 'fetch' | 'cookies'>,
	path: string,
	params: Record<string, string | number | undefined> = {}
): Promise<T[]> {
	await ensureAuthenticated(event);
	const key = `${path}?${new URLSearchParams(
		Object.entries(params)
			.filter(([, value]) => value !== undefined && value !== '')
			.map(([name, value]) => [name, String(value)])
	)}`;
	const existing = fullCollectionCache.get(key) as
		| { data: T[]; fetchedAt: number; promise?: Promise<T[]> }
		| undefined;
	if (existing && Date.now() - existing.fetchedAt < FULL_COLLECTION_CACHE_TTL_MS) {
		return existing.data;
	}
	if (existing?.promise) return existing.promise;

	const promise = (async () => {
		const records: T[] = [];
		let offset = 0;
		let hasMore = true;

		while (hasMore) {
			const batchOffsets = Array.from({ length: 8 }, (_, index) => offset + index * UPSTREAM_PAGE_SIZE);
			const pages = await Promise.all(
				batchOffsets.map((pageOffset) => fetchCollectionPage<T>(event, path, params, pageOffset))
			);
			for (const page of pages) {
				records.push(...page.results);
				if (!page.has_more || page.results.length === 0) hasMore = false;
			}
			offset += pages.reduce((sum, page) => sum + page.results.length, 0);
		}
		return records;
	})();

	fullCollectionCache.set(key, { data: existing?.data ?? [], fetchedAt: existing?.fetchedAt ?? 0, promise });
	try {
		const data = await promise;
		fullCollectionCache.set(key, { data, fetchedAt: Date.now() });
		return data;
	} catch (error) {
		fullCollectionCache.set(key, existing ?? { data: [], fetchedAt: 0 });
		throw error;
	}
}
