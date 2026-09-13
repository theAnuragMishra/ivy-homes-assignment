import type { RequestEvent } from '@sveltejs/kit';
import { authenticatedRequest, ensureAuthenticated } from '$lib/server/authenticated-api';

const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
	data: T[];
	fetchedAt: number;
	promise: Promise<T[]> | null;
};

const caches = new Map<string, CacheEntry<unknown>>();

async function fetchAll<T>(
	event: Pick<RequestEvent, 'fetch' | 'cookies'>,
	path: string
): Promise<T[]> {
	const records: T[] = [];
	let offset = 0;
	// The server caps limit at 50 no matter what we ask for, so request 50
	// directly and advance by the actual batch size, stopping on has_more.
	for (;;) {
		const batch = await authenticatedRequest<{
			results: T[];
			has_more: boolean;
		}>(event, `${path}?limit=50&offset=${offset}`);
		records.push(...batch.results);
		if (!batch.has_more || batch.results.length === 0) break;
		offset += batch.results.length;
	}
	return records;
}

/**
 * Returns the full, cached collection for `path` (e.g. "/v1/listings"),
 * fetching and caching it on first use per server process. Concurrent
 * callers during a cold/expired cache share a single in-flight fetch.
 */
export async function getFullCollection<T>(
	event: Pick<RequestEvent, 'fetch' | 'cookies'>,
	path: string
): Promise<T[]> {
	// A warm cache would otherwise skip the auth check that a live upstream
	// request performs on every call, so check the caller's own session
	// explicitly regardless of cache state.
	await ensureAuthenticated(event);

	const existing = caches.get(path) as CacheEntry<T> | undefined;
	const now = Date.now();

	if (existing && now - existing.fetchedAt < CACHE_TTL_MS) {
		return existing.data;
	}
	if (existing?.promise) {
		return existing.promise;
	}

	const promise = fetchAll<T>(event, path);
	caches.set(path, {
		data: existing?.data ?? [],
		fetchedAt: existing?.fetchedAt ?? 0,
		promise
	});

	try {
		const data = await promise;
		caches.set(path, { data, fetchedAt: Date.now(), promise: null });
		return data;
	} catch (error) {
		// Restore the previous good cache (if any) so a transient upstream
		// error doesn't wipe out a working cache; otherwise let it clear so
		// the next request can retry against a cold cache.
		caches.set(path, { data: existing?.data ?? [], fetchedAt: existing?.fetchedAt ?? 0, promise: null });
		throw error;
	}
}
