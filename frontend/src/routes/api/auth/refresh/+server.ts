import { json } from '@sveltejs/kit';
import { IvyApiError, ivyRequest } from '$lib/server/ivy-api';
import { getSession, setSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

type RefreshResponse = {
	access_token: string;
	refresh_token?: string;
};

export const POST: RequestHandler = async ({ fetch, cookies }) => {
	const { refreshToken } = getSession(cookies);
	if (!refreshToken) {
		return json({ detail: 'No refresh token is available.' }, { status: 401 });
	}

	try {
		const result = await ivyRequest<RefreshResponse>(fetch, '/auth/refresh', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: refreshToken })
		});
		setSession(cookies, result.access_token, result.refresh_token ?? refreshToken);
		return json({ ok: true });
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
