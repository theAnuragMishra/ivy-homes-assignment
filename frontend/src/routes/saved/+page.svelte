<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Listing } from '$lib/server/listings';
	import { isSaved, loadSaved, toggleSaved } from '$lib/saved-store.svelte';

	let listings = $state<Listing[]>([]);
	let loading = $state(true);
	let error = $state('');

	async function refresh() {
		loading = true;
		error = '';
		try {
			listings = await loadSaved();
		} catch {
			error = 'Unable to reach the application server.';
		} finally {
			loading = false;
		}
	}

	async function unsave(listingId: string) {
		await toggleSaved(listingId);
		listings = listings.filter((item) => item.listing_id !== listingId);
	}

	onMount(() => {
		void refresh();
	});
</script>

<svelte:head>
	<title>Saved listings | Ivy Homes</title>
	<meta name="description" content="Listings you've saved for later, persisted per user." />
</svelte:head>

<main class="shell">
	<a class="back" href={resolve('/listings')}>← Back to listings</a>
	<p class="eyebrow">SAVED LISTINGS</p>
	<h1>Your shortlist.</h1>
	<p class="muted">
		Saved via the live <code>/v1/saved</code> API (the documented
		<code>/v1/favourites</code> routes return 404). This list is per-user and survives a reload
		and a re-login.
	</p>

	{#if error}
		<p class="message error" role="alert">{error}</p>
	{:else if loading}
		<p class="message">Loading your saved listings…</p>
	{:else if listings.length === 0}
		<p class="message">
			Nothing saved yet. Go <a href={resolve('/listings')}>browse listings</a> and tap "Save" on
			anything you like.
		</p>
	{:else}
		<section class="grid" aria-label="Saved listings">
			{#each listings as listing (listing.listing_id)}
				<div class="card">
					<a class="card-link" href={resolve(`/listings/${listing.listing_id}`)}>
						<div class="card-top">
							<span class="tag">{listing.bedroom} BHK</span>
							<span class:inactive={!listing.is_live}>{listing.is_live ? 'Live' : 'Inactive'}</span>
						</div>
						<h2>{listing.apartment_name}</h2>
						<p class="location">{listing.locality} · {listing.property_type}</p>
						<strong class="price">₹{listing.price.toLocaleString('en-IN')}</strong>
						<p class="details">{listing.carpet_area.toLocaleString()} sq ft carpet · {listing.furnishing}</p>
					</a>
					<button class="unsave" type="button" onclick={() => void unsave(listing.listing_id)}>
						{isSaved(listing.listing_id) ? 'Remove' : 'Removed'}
					</button>
				</div>
			{/each}
		</section>
	{/if}
</main>

<style>
	:global(body) { margin: 0; background: #f5f3ee; color: #1e2924; font-family: Inter, system-ui, sans-serif; }
	.shell { width: min(76rem, calc(100% - 3rem)); margin: 0 auto; padding: 2rem 0 4rem; }
	.back { color: #1e5b3a; font-weight: 700; text-decoration: none; display: block; margin-bottom: 2rem; font-size: .9rem; }
	.eyebrow { margin: 0 0 .7rem; color: #557762; font-size: .75rem; font-weight: 800; letter-spacing: .16em; }
	h1 { margin: 0; font-size: clamp(2.3rem, 6vw, 4.5rem); line-height: .95; letter-spacing: -.06em; }
	.muted { max-width: 44rem; color: #68746d; line-height: 1.6; margin: 1rem 0 2rem; }
	.muted code { background: #eceadf; padding: .05rem .35rem; border-radius: .3rem; }
	.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	.card { border: 1px solid #e1ddd4; border-radius: 1rem; background: #fff; }
	.card-link { display: grid; gap: .65rem; padding: 1.25rem; color: inherit; text-decoration: none; }
	.card-top { display: flex; justify-content: space-between; color: #557762; font-size: .78rem; font-weight: 800; }
	.tag { padding: .25rem .45rem; border-radius: .35rem; background: #e8eee9; }
	.inactive { color: #a3362d; }
	h2 { margin: .5rem 0 0; font-size: 1.2rem; }
	.location, .details { margin: 0; color: #68746d; font-size: .9rem; }
	.price { margin-top: .35rem; font-size: 1.35rem; }
	.unsave { width: calc(100% - 2.5rem); margin: 0 1.25rem 1.25rem; padding: .6rem; border: 1px solid #e2b8b0; border-radius: .55rem; background: #fbecea; color: #a3362d; font: inherit; font-weight: 700; cursor: pointer; }
	.message { padding: 2rem 0; color: #68746d; }
	.message a { color: #1e5b3a; font-weight: 700; }
	.error { color: #a3362d; }
	@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
	@media (max-width: 560px) { .shell { width: min(100% - 2rem, 34rem); } .grid { grid-template-columns: 1fr; } }
</style>
