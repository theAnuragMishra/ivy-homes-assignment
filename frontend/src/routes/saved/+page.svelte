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

<main class="mx-auto w-[min(76rem,calc(100%-3rem))] py-8 pb-16 max-[560px]:w-[calc(100%-2rem)]">
	<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">SAVED LISTINGS</p>
	<h1 class="m-0 mb-6 text-[clamp(2.3rem,6vw,4.5rem)] leading-[.95] tracking-[-.06em]">Your shortlist.</h1>
	

	{#if error}
		<p class="py-8 text-[#a3362d]" role="alert">{error}</p>
	{:else if loading}
		<p class="py-8 text-[#68746d]">Loading your saved listings…</p>
	{:else if listings.length === 0}
		<p class="py-8 text-[#68746d]">
			Nothing saved yet. Go <a class="font-bold text-[#1e5b3a]" href={resolve('/listings')}>browse listings</a> and tap "Save" on
			anything you like.
		</p>
	{:else}
		<section class="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1" aria-label="Saved listings">
			{#each listings as listing (listing.listing_id)}
				<div class="rounded-2xl border border-[#e1ddd4] bg-white">
					<a class="grid gap-2.5 p-5 text-inherit no-underline" href={resolve(`/listings/${listing.listing_id}`)}>
						<div class="flex justify-between text-xs font-extrabold text-[#557762]">
							<span class="tag rounded-md bg-[#e8eee9] px-2 py-1">{listing.bedroom} BHK</span>
							<span class={listing.is_live ? 'text-[#557762]' : 'text-[#a3362d]'}>{listing.is_live ? 'Live' : 'Inactive'}</span>
						</div>
						<h2 class="m-0 mt-2 text-xl">{listing.apartment_name}</h2>
						<p class="m-0 text-sm text-[#68746d]">{listing.locality} · {listing.property_type}</p>
						<strong class="mt-1 text-[1.35rem]">₹{listing.price.toLocaleString('en-IN')}</strong>
						<p class="m-0 text-sm text-[#68746d]">{listing.carpet_area.toLocaleString()} sq ft carpet · {listing.furnishing}</p>
					</a>
					<button class="unsave mx-5 mb-5 w-[calc(100%-2.5rem)] cursor-pointer rounded-[.55rem] border border-[#e2b8b0] bg-[#fbecea] p-2.5 font-inherit font-bold text-[#a3362d]" type="button" onclick={() => void unsave(listing.listing_id)}>
						{isSaved(listing.listing_id) ? 'Remove' : 'Removed'}
					</button>
				</div>
			{/each}
		</section>
	{/if}
 </main>
