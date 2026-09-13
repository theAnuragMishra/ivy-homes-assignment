import type { Listing } from '$lib/server/listings';
import { SvelteSet } from 'svelte/reactivity';

/**
 * Shared client-side saved-listing state so the "Save" button on the
 * listings grid and on a listing detail page always agree, without every
 * component re-fetching /api/saved on its own.
 */

const ids = new SvelteSet<string>();
let loaded = $state(false);

export function savedIds() {
	return ids;
}

export function isSaved(listingId: string) {
	return ids.has(listingId);
}

export async function loadSaved(): Promise<Listing[]> {
	const response = await fetch('/api/saved');
	if (!response.ok) return [];
	const payload = (await response.json()) as { results: Listing[] };
	payload.results.forEach((listing) => {
		ids.add(listing.listing_id);
	});
	loaded = true;
	return payload.results;
}

export function isSavedLoaded() {
	return loaded;
}

export async function toggleSaved(listingId: string): Promise<void> {
	if (ids.has(listingId)) {
		const response = await fetch(`/api/saved/${encodeURIComponent(listingId)}`, {
			method: 'DELETE'
		});
		if (response.ok) {
			ids.delete(listingId);
		}
		return;
	}

	const response = await fetch('/api/saved', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ listing_id: listingId })
	});
	if (response.ok) {
		ids.add(listingId);
	}
}
