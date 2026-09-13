import { IvyApiError, ivyRequest } from '$lib/server/ivy-api';
import { getSession, setSession } from '$lib/server/session';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

export async function authenticatedRequest<T>(
	event: Pick<RequestEvent, 'fetch' | 'cookies'>,
	path: string,
	options: RequestInit = {}
): Promise<T> {
	const accessToken = await ensureAuthenticated(event);

	const request = (token: string) =>
		ivyRequest<T>(event.fetch, path, {
			...options,
			headers: {
				...(options.headers ?? {}),
				Authorization: `Bearer ${token}`
			}
		});

	try {
		return await request(accessToken);
	} catch (error) {
		if (!(error instanceof IvyApiError) || error.status !== 401) {
			throw error;
		}
		const { refreshToken } = getSession(event.cookies);
		if (!refreshToken) throw error;
		const refreshed = await refreshAccessToken(event.fetch, event.cookies, refreshToken);
		return request(refreshed);
	}
}

/**
 * Confirms the caller has a session and returns a usable access token,
 * refreshing it first if necessary. Every route that reads from the
 * shared dataset cache (dataset-cache.ts) must call this before touching
 * the cache, since a warm cache would otherwise skip the token check that
 * `authenticatedRequest` normally performs on every call.
 */
export async function ensureAuthenticated(
	event: Pick<RequestEvent, 'fetch' | 'cookies'>
): Promise<string> {
	const { accessToken, refreshToken } = getSession(event.cookies);
	if (!refreshToken) {
		throw new IvyApiError(401, 'You are not signed in.');
	}
	if (accessToken) return accessToken;
	return refreshAccessToken(event.fetch, event.cookies, refreshToken);
}

async function refreshAccessToken(
	fetch: typeof globalThis.fetch,
	cookies: Cookies,
	refreshToken: string
): Promise<string> {
	const result = await ivyRequest<{ access_token: string; refresh_token?: string }>(
		fetch,
		'/auth/refresh',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: refreshToken })
		}
	);
	setSession(cookies, result.access_token, result.refresh_token ?? refreshToken);
	return result.access_token;
}
