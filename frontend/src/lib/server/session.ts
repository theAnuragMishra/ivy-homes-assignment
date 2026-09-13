import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/environment';

const ACCESS_TOKEN = 'ivy_access_token';
const REFRESH_TOKEN = 'ivy_refresh_token';

const cookieOptions = {
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: !dev,
	path: '/'
};

export function setSession(cookies: Cookies, accessToken: string, refreshToken: string) {
	cookies.set(ACCESS_TOKEN, accessToken, {
		...cookieOptions,
		maxAge: 15 * 60
	});
	cookies.set(REFRESH_TOKEN, refreshToken, {
		...cookieOptions,
		maxAge: 14 * 24 * 60 * 60
	});
}

export function getSession(cookies: Cookies) {
	return {
		accessToken: cookies.get(ACCESS_TOKEN),
		refreshToken: cookies.get(REFRESH_TOKEN)
	};
}

export function clearSession(cookies: Cookies) {
	cookies.delete(ACCESS_TOKEN, cookieOptions);
	cookies.delete(REFRESH_TOKEN, cookieOptions);
}
