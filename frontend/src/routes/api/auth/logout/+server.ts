import { json } from '@sveltejs/kit';
import { ivyRequest, IvyApiError } from '$lib/server/ivy-api';
import { clearSession, getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ fetch, cookies }) => {
	const { accessToken } = getSession(cookies);
	if (accessToken) {
		try {
			await ivyRequest(fetch, '/auth/logout', {
				method: 'POST',
				headers: { Authorization: `Bearer ${accessToken}` }
			});
		} catch (error) {
			if (!(error instanceof IvyApiError) || error.status !== 401) {
				throw error;
			}
		}
	}

	clearSession(cookies);
	return json({ ok: true });
};
