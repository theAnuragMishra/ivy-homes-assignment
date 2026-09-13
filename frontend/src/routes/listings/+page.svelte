<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Listing, ListingCollection } from '../api/listings/+server';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { isSaved, loadSaved, toggleSaved } from '$lib/saved-store.svelte';

	let listings = $state<Listing[]>([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state('');
	let hasMore = $state(false);
	let offset = $state(0);
	let locality = $state('');
	let bedroom = $state('');
	let furnishing = $state('');
	let minPrice = $state('');
	let maxPrice = $state('');
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
		if (minPrice) params.set('min_price', minPrice);
		if (maxPrice) params.set('max_price', maxPrice);
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
		minPrice = '';
		maxPrice = '';
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

<main class="shell">
	<header class="topbar">
		<div>
			<a class="back" href={resolve('/')}>← Workspace</a>
			<p class="eyebrow">SALE LISTINGS</p>
			<h1>Find your next place.</h1>
		</div>
		<a class="saved-link" href={resolve('/saved')}>Saved listings</a>
	</header>

	<section class="filters" aria-label="Listing filters">
		<label>
			Locality
			<input
				bind:value={locality}
				placeholder="e.g. thoraipakkam"
				oninput={() => void debounceFetchListings(true)}
			/>
		</label>
		<label>
			Property Type
			<select bind:value={propertyType} onchange={() => void fetchListings(true)}>
				<option value="">Any</option>
				<option value="apartment">Apartment</option>
				<option value="villa">Villa</option>
				<option value="plot">Plot</option>
				<option value="independent house">Independent House</option>
				<option value="builder floor">Builder Floor</option>
			</select>
		</label>
		<label>
			Bedrooms
			<select bind:value={bedroom} onchange={() => void fetchListings(true)}>
				<option value="">Any</option>
				<option value="0">Plot</option>
				<option value="1">1 BHK</option>
				<option value="2">2 BHK</option>
				<option value="3">3 BHK</option>
				<option value="4">4 BHK</option>
				<option value="5">5 BHK</option>
			</select>
		</label>
		<label>
			Furnishing
			<select bind:value={furnishing} onchange={() => void fetchListings(true)}>
				<option value="">Any furnishing</option>
				<option value="unfurnished">Unfurnished</option>
				<option value="semi-furnished">Semi-furnished</option>
				<option value="fully-furnished">Fully-furnished</option>
			</select>
		</label>
		<label>
			Min price
			<input bind:value={minPrice} type="number" min="0" placeholder="₹" oninput={() => void fetchListings(true)} />
		</label>
		<label>
			Max price
			<input bind:value={maxPrice} type="number" min="0" placeholder="₹" oninput={() => void fetchListings(true)} />
		</label>
		
		<label>
			Sort by
			<select bind:value={sortBy} onchange={() => void fetchListings(true)}>
				<option value="">Default</option>
				<option value="price">Price</option>
				<option value="carpet_area">Carpet Area</option>
				<option value="posted_at">Posted At</option>
				<option value="bedroom">Bedroom</option>
			</select>
		</label>
		<label>
			Order
			<select bind:value={order} onchange={() => void fetchListings(true)}>
				<option value="asc">Ascending</option>
				<option value="desc">Descending</option>
			</select>
		</label>
		
			
			<label class="checkbox">
			<input type="checkbox" bind:checked={liveOnly} onchange={() => void fetchListings(true)} />
			Active only
		</label>
		<button class="clear" type="button" onclick={resetFilters}>Clear Filters</button>
	</section>

	{#if error}
		<p class="message error" role="alert">{error}</p>
	{:else if loading}
		<p class="message">Loading listings…</p>
	{:else}
		<div class="summary">
			
			<span>Loaded {listings.length} listings</span>
		</div>
		{#if listings.length === 0}
			<p class="message">No listings match these filters.</p>
		{:else}
			<section class="grid" aria-label="Listings">
				{#each listings as listing (listing.listing_id)}
					<div class="card">
						<a class="card-link" href={resolve(`/listings/${listing.listing_id}`)}>
							<div class="card-top">
								<span class="tag">{listing.bedroom > 0 ? `${listing.bedroom} BHK` : 'Plot'}</span>
								<span class:inactive={!listing.is_live}
									>{listing.is_live ? 'Live' : 'Inactive'}</span
								>
							</div>
							<h2>{listing.apartment_name}</h2>
							<p class="location">{listing.locality} · {listing.property_type}</p>
							<strong class="price">₹{listing.price.toLocaleString('en-IN')}</strong>
							<p class="details">
								{listing.carpet_area.toLocaleString()} sq ft carpet · {listing.furnishing}
							</p>
						</a>
						<button
							class="save-toggle"
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
					class="load-more"
					type="button"
					disabled={loadingMore}
					onclick={() => void fetchListings()}
				>
					{loadingMore ? 'Loading…' : 'Load more'}
				</button>
			{/if}
		{/if}
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f5f3ee;
		color: #1e2924;
		font-family: Inter, system-ui, sans-serif;
	}
	.shell {
		width: min(76rem, calc(100% - 3rem));
		margin: 0 auto;
		padding: 2rem 0 4rem;
	}
	.topbar {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 2rem;
		margin-bottom: 1rem;
	}
	.back,
	.saved-link {
		color: #1e5b3a;
		font-weight: 700;
		text-decoration: none;
	}
	.back {
		display: block;
		margin-bottom: 2rem;
		font-size: 0.9rem;
	}
	.eyebrow {
		margin: 0 0 0.7rem;
		color: #557762;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.16em;
	}
	h1 {
		margin: 0;
		font-size: clamp(2.3rem, 6vw, 4.5rem);
		line-height: 0.95;
		letter-spacing: -0.06em;
	}
	
	.filters {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.75rem;
		align-items: end;
		padding: 1rem;
		border: 1px solid #e1ddd4;
		border-radius: 1rem;
		background: #fff;
	}
	label {
		display: grid;
		gap: 0.35rem;
		color: #526058;
		font-size: 0.78rem;
		font-weight: 700;
	}
	label.checkbox {
		flex-direction: row;
		align-items: center;
		display: flex;
		gap: 0.4rem;
	}
	input,
	select {
		box-sizing: border-box;
		width: 100%;
		padding: 0.7rem;
		border: 1px solid #d8d5cc;
		border-radius: 0.55rem;
		background: #fff;
		color: inherit;
		font: inherit;
	}
	.checkbox input {
		width: auto;
		padding: 0;
	}
	.clear,
	.load-more {
		padding: 0.72rem 1rem;
		border: 0;
		border-radius: 0.55rem;
		background: #1e5b3a;
		color: white;
		font: inherit;
		font-weight: 800;
		cursor: pointer;
	}
	.clear {
		background: #e8eee9;
		color: #1e5b3a;
	}
	.summary {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
		margin: 2rem 0 1rem;
		color: #68746d;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}
	.card {
		position: relative;
		border: 1px solid #e1ddd4;
		border-radius: 1rem;
		background: #fff;
		transition:
			transform 0.2s,
			border-color 0.2s;
	}
	.card:hover {
		transform: translateY(-3px);
		border-color: #8bb699;
	}
	.card-link {
		display: grid;
		gap: 0.65rem;
		padding: 1.25rem;
		color: inherit;
		text-decoration: none;
	}
	.card-top {
		display: flex;
		justify-content: space-between;
		color: #557762;
		font-size: 0.78rem;
		font-weight: 800;
	}
	.tag {
		padding: 0.25rem 0.45rem;
		border-radius: 0.35rem;
		background: #e8eee9;
	}
	.inactive {
		color: #a3362d;
	}
	h2 {
		margin: 0.5rem 0 0;
		font-size: 1.2rem;
	}
	.location,
	.details {
		margin: 0;
		color: #68746d;
		font-size: 0.9rem;
	}
	.price {
		margin-top: 0.35rem;
		font-size: 1.35rem;
	}
	.save-toggle {
		position: absolute;
		top: 0.85rem;
		right: 0.85rem;
		padding: 0.35rem 0.6rem;
		border: 1px solid #d8d5cc;
		border-radius: 0.5rem;
		background: #fff;
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
		color: #526058;
	}
	.save-toggle.saved {
		border-color: #c99a2e;
		color: #8a6a1a;
		background: #fdf6e6;
	}
	.message {
		padding: 2rem 0;
		color: #68746d;
	}
	.error {
		color: #a3362d;
	}
	.load-more {
		display: block;
		margin: 2rem auto 0;
	}
	@media (max-width: 900px) {
		.filters {
			grid-template-columns: repeat(3, 1fr);
		}
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 560px) {
		.shell {
			width: min(100% - 2rem, 34rem);
		}
		.topbar {
			align-items: start;
			flex-direction: column;
		}
		.filters,
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
