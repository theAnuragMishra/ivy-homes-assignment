import { json } from '@sveltejs/kit';
import { IvyApiError, ivyRequest } from '$lib/server/ivy-api';
import { setSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

type LoginResponse = {
	access_token: string;
	refresh_token: string;
	user: {
		email: string;
		name?: string;
	};
};

export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	const body = await request.json();
	if (
		typeof body?.email !== 'string' ||
		typeof body?.password !== 'string' ||
		!body.email ||
		!body.password
	) {
		return json({ detail: 'Email and password are required.' }, { status: 400 });
	}

	try {
		const result = await ivyRequest<LoginResponse>(fetch, '/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: body.email, password: body.password })
		});
		setSession(cookies, result.access_token, result.refresh_token);
		return json({ user: result.user });
	} catch (error) {
		if (error instanceof IvyApiError) {
			return json({ detail: error.detail }, { status: error.status });
		}
		throw error;
	}
};
