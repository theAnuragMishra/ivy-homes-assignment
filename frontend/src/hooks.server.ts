import { redirect, type Handle } from '@sveltejs/kit';
import { ensureAuthenticated } from '$lib/server/authenticated-api';
import { clearSession } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;

	if (pathname.startsWith('/api/')) {
		return resolve(event);
	}

	if (pathname === '/login') {
		let authenticated = false;
		try {
			await ensureAuthenticated(event);
			authenticated = true;
		} catch {
			clearSession(event.cookies);
		}
		if (authenticated) throw redirect(303, '/');
		return resolve(event);
	}

	try {
		await ensureAuthenticated(event);
	} catch {
		clearSession(event.cookies);
		throw redirect(303, `/login?redirect=${encodeURIComponent(pathname)}`);
	}

	return resolve(event);
};
