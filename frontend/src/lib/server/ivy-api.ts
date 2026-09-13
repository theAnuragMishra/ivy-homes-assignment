import { env } from '$env/dynamic/private';

function requiredEnv(name: 'API_BASE_URL' | 'API_KEY'): string {
	const value = env[name];
	if (!value) {
		throw new Error(`Missing required server environment variable: ${name}`);
	}
	return value;
}

export class IvyApiError extends Error {
	status: number;
	detail: string;

	constructor(status: number, detail: string) {
		super(detail);
		this.name = 'IvyApiError';
		this.status = status;
		this.detail = detail;
	}
}

export async function ivyRequest<T>(
	fetch: typeof globalThis.fetch,
	path: string,
	options: RequestInit = {}
): Promise<T> {
	const headers = new Headers(options.headers);
	headers.set('X-API-Key', requiredEnv('API_KEY'));

	const response = await fetch(`${requiredEnv('API_BASE_URL').replace(/\/$/, '')}${path}`, {
		...options,
		headers
	});

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		payload = {};
	}

	if (!response.ok) {
		const detail =
			typeof payload === 'object' &&
			payload !== null &&
			'detail' in payload &&
			typeof payload.detail === 'string'
				? payload.detail
				: 'The Ivy Homes API returned an error.';
		throw new IvyApiError(response.status, detail);
	}

	return payload as T;
}
