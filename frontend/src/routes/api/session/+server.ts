import { json } from '@sveltejs/kit';
import { IvyApiError, ivyRequest } from '$lib/server/ivy-api';
import { getSession, setSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	let { accessToken, refreshToken } = getSession(cookies);
	if (!refreshToken) {
		return json({ authenticated: false });
	}

	if (!accessToken) {
		try {
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
			accessToken = result.access_token;
		} catch (error) {
			if (error instanceof IvyApiError) {
				return json({ authenticated: false });
			}
			throw error;
		}
	}

	return json({ authenticated: Boolean(accessToken && refreshToken) });
};
