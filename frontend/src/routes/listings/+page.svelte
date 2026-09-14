<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Listing, ListingCollection } from '../api/listings/+server';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { isSaved, loadSaved, toggleSaved } from '$lib/saved-store.svelte';
	import RangeSlider from '$lib/RangeSlider.svelte';

	let listings = $state<Listing[]>([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state('');
	let hasMore = $state(false);
	let offset = $state(0);
	let locality = $state('');
	let bedroom = $state('');
	let furnishing = $state('');
	const priceMin = 0;
	const priceMax = 100_000_000;
	let minPrice = $state(priceMin);
	let maxPrice = $state(priceMax);
	let liveOnly = $state(true);
	let propertyType = $state('');
	let sortBy = $state('');
	let order = $state('asc');

	function buildQuery(startOffset: number) {
		const params = new SvelteURLSearchParams({
			limit: '30',
			offset: String(startOffset)
		});
		if (locality) params.set('locality', locality.trim().toLowerCase());
		if (bedroom) params.set('bhk', bedroom);
		if (propertyType) params.set('property_type', propertyType);
		if (sortBy) params.set('sort_by', sortBy);
		if (order) params.set('order', order);
		if (furnishing) params.set('furnishing', furnishing);
		if (minPrice > priceMin) params.set('min_price', String(minPrice));
		if (maxPrice < priceMax) params.set('max_price', String(maxPrice));
		if (liveOnly) params.set('is_live', 'true');
		return params;
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	let searchController: AbortController | null = null;

	function debounceFetchListings(reset = false) {
		clearTimeout(searchTimer);

		searchTimer = setTimeout(() => {
			void fetchListings(reset);
		}, 300);
	}

	async function fetchListings(reset = false) {
		console.log('fetching');

		if (reset) {
			searchController?.abort();
			searchController = new AbortController();
		}

		const controller = searchController;

		if (reset) {
			loading = true;
			error = '';
			offset = 0;
		} else {
			loadingMore = true;
		}

		try {
			const startOffset = reset ? 0 : offset;

			const response = await fetch(`/api/listings?${buildQuery(startOffset)}`, {
				signal: controller?.signal
			});

			const payload = (await response.json()) as ListingCollection | { detail?: string };

			if (!response.ok || !('results' in payload)) {
				error =
					'detail' in payload
						? (payload.detail ?? 'Unable to load listings.')
						: 'Unable to load listings.';
				return;
			}

			listings = reset ? payload.results : [...listings, ...payload.results];

			offset = startOffset + payload.results.length;
			hasMore = payload.has_more;
			// total = payload.total;
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				return;
			}

			error = 'Unable to reach the application server.';
		} finally {
			if (!controller?.signal.aborted) {
				loading = false;
				loadingMore = false;
			}
		}
	}

	function resetFilters() {
		locality = '';
		bedroom = '';
		propertyType = '';
		sortBy = '';
		order = 'asc';
		furnishing = '';
		minPrice = priceMin;
		maxPrice = priceMax;
		liveOnly = true;
		void fetchListings(true);
	}

	onMount(() => {
		void fetchListings(true);
		void loadSaved();
	});
</script>

<svelte:head>
	<title>Listings | Ivy Homes</title>
	<meta name="description" content="Browse sale listings from the Ivy Homes API." />
</svelte:head>

<main
	class="mx-auto w-[min(76rem,calc(100%-3rem))] py-8 pb-16 max-[900px]:w-[calc(100%-3rem)] max-[560px]:w-[calc(100%-2rem)]"
>
	<header
		class="mb-10 flex items-end justify-between gap-8 max-[560px]:flex-col max-[560px]:items-start"
	>
		<div>
			<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">SALE LISTINGS</p>
			<h1 class="m-0 text-[clamp(2.3rem,6vw,4.5rem)] leading-[.95] tracking-[-.06em]">
				Find your next place.
			</h1>
		</div>
		<a class="font-bold text-[#1e5b3a] no-underline" href={resolve('/saved')}>Saved listings</a>
	</header>

	<div class="grid grid-cols-[16rem_minmax(0,1fr)] items-start gap-8 max-[900px]:grid-cols-1">
		<aside
			class="sticky top-6 grid gap-4 rounded-2xl border border-[#e1ddd4] bg-white p-4 max-[900px]:static"
			aria-label="Listing filters"
		>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Locality
				<input
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit text-[#1e2924]"
					bind:value={locality}
					placeholder="e.g. thoraipakkam"
					oninput={() => void debounceFetchListings(true)}
				/>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Property Type
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit text-[#1e2924]"
					bind:value={propertyType}
					onchange={() => void fetchListings(true)}
				>
					<option value="">Any</option>
					<option value="apartment">Apartment</option>
					<option value="villa">Villa</option>
					<option value="plot">Plot</option>
					<option value="independent house">Independent House</option>
					<option value="builder floor">Builder Floor</option>
				</select>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Bedrooms
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit text-[#1e2924]"
					bind:value={bedroom}
					onchange={() => void fetchListings(true)}
				>
					<option value="">Any</option>
					<option value="0">Plot</option>
					<option value="1">1 BHK</option>
					<option value="2">2 BHK</option>
					<option value="3">3 BHK</option>
					<option value="4">4 BHK</option>
					<option value="5">5 BHK</option>
				</select>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Furnishing
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit text-[#1e2924]"
					bind:value={furnishing}
					onchange={() => void fetchListings(true)}
				>
					<option value="">Any furnishing</option>
					<option value="unfurnished">Unfurnished</option>
					<option value="semi-furnished">Semi-furnished</option>
					<option value="fully-furnished">Fully-furnished</option>
				</select>
			</label>
			<RangeSlider
				label="Price"
				min={priceMin}
				max={priceMax}
				step={100_000}
				bind:lower={minPrice}
				bind:upper={maxPrice}
				format={(value) => {return value >= 10000000 ? `${(value / 10000000).toFixed(value === 0 ? 0 : 1)} Cr` : `₹${(value / 100000).toFixed(value === 0 ? 0 : 1)}L`}}
				onChange={() => debounceFetchListings(true)}
			/>

			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Sort by
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit text-[#1e2924]"
					bind:value={sortBy}
					onchange={() => void fetchListings(true)}
				>
					<option value="">Default</option>
					<option value="price">Price</option>
					<option value="carpet_area">Carpet Area</option>
					<option value="posted_at">Posted At</option>
					<option value="bedroom">Bedroom</option>
				</select>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Order
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit text-[#1e2924]"
					bind:value={order}
					onchange={() => void fetchListings(true)}
				>
					<option value="asc">Ascending</option>
					<option value="desc">Descending</option>
				</select>
			</label>

			<label class="flex items-center gap-1.5 text-xs font-bold text-[#526058]">
				<input type="checkbox" bind:checked={liveOnly} onchange={() => void fetchListings(true)} />
				Active only
			</label>
			<button
				class="clear cursor-pointer rounded-[.55rem] border-0 bg-[#e8eee9] px-4 py-3 font-inherit font-extrabold text-[#1e5b3a]"
				type="button"
				onclick={resetFilters}>Clear Filters</button
			>
		</aside>

		<section class="min-w-0">
			{#if error}
				<p class="py-8 text-[#a3362d]" role="alert">{error}</p>
			{:else if loading}
				<p class="py-8 text-[#68746d]">Loading listings…</p>
			{:else}
				{#if listings.length === 0}
					<p class="py-8 text-[#68746d]">No listings match these filters.</p>
				{:else}
					<section
						class="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1"
						aria-label="Listings"
					>
						{#each listings as listing (listing.listing_id)}
							<div
								class="relative rounded-2xl border border-[#e1ddd4] bg-white transition hover:-translate-y-0.5 hover:border-[#8bb699]"
							>
								<a
									class="grid gap-2.5 p-5 text-inherit no-underline"
									href={resolve(`/listings/${listing.listing_id}`)}
								>
									<div class="flex justify-between text-xs font-extrabold text-[#557762]">
										<span class="tag rounded-md bg-[#e8eee9] px-2 py-1"
											>{listing.bedroom > 0 ? `${listing.bedroom} BHK` : 'Plot'}</span
										>
										<span class={listing.is_live ? 'text-[#557762]' : 'text-[#a3362d]'}
											>{listing.is_live ? 'Live' : 'Inactive'}</span
										>
									</div>
									<h2 class="m-0 mt-2 text-xl">{listing.apartment_name}</h2>
									<p class="m-0 text-sm text-[#68746d]">
										{listing.locality} · <svg
											xmlns="http://www.w3.org/2000/svg"
											width="1em"
											height="1em"
											viewBox="0 0 24 24"
											class="inline-block align-middle"
										>
											<path d="M0 0h24v24H0z" fill="none" />
											<g
												fill="none"
												stroke="currentColor"
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
											>
												<circle cx="12" cy="10" r="3" />
												<path
													d="M12 2a8 8 0 0 0-8 8c0 1.892.402 3.13 1.5 4.5L12 22l6.5-7.5c1.098-1.37 1.5-2.608 1.5-4.5a8 8 0 0 0-8-8"
												/>
											</g>
										</svg>{listing.property_type}
									</p>
									<strong class="mt-1 text-[1.35rem]"
										>₹{listing.price.toLocaleString('en-IN')}</strong
									>
									<p class="m-0 text-sm text-[#68746d]">
										{listing.carpet_area.toLocaleString()} sq ft carpet · {listing.furnishing}
									</p>
								</a>
								<button
									class="save-toggle absolute right-3 top-3 cursor-pointer rounded-lg border border-[#d8d5cc] bg-white px-2.5 py-1.5 text-xs font-bold text-[#526058] data-[saved=true]:border-[#c99a2e]"
									class:saved={isSaved(listing.listing_id)}
									type="button"
									onclick={() => void toggleSaved(listing.listing_id)}
								>
									{isSaved(listing.listing_id) ? '★ Saved' : '☆ Save'}
								</button>
							</div>
						{/each}
					</section>
					{#if hasMore}
						<button
							class="load-more mx-auto mt-8 block cursor-pointer rounded-[.55rem] border-0 bg-[#1e5b3a] px-4 py-3 font-inherit font-extrabold text-white"
							type="button"
							disabled={loadingMore}
							onclick={() => void fetchListings()}
						>
							{loadingMore ? 'Loading…' : 'Load more'}
						</button>
					{/if}
				{/if}
			{/if}
		</section>
	</div>
</main>
