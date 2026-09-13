<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Rental, RentalCollection } from '../api/rentals/+server';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	let rentals = $state<Rental[]>([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state('');
	let hasMore = $state(false);
	let offset = $state(0);
	let locality = $state('');
	let bedroom = $state('');
	let propertyType = $state('');
	let furnishing = $state('');
	let minPrice = $state('');
	let maxPrice = $state('');
	let liveOnly = $state(true);
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

	function debounceFetchRentals(reset = false) {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			void fetchRentals(reset);
		}, 300);
	}

	async function fetchRentals(reset = false) {
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
			const response = await fetch(`/api/rentals?${buildQuery(startOffset)}`, {
				signal: controller?.signal
			});
			const payload = (await response.json()) as RentalCollection | { detail?: string };
			if (!response.ok || !('results' in payload)) {
				error =
					'detail' in payload
						? (payload.detail ?? 'Unable to load rentals.')
						: 'Unable to load rentals.';
				return;
			}
			rentals = reset ? payload.results : [...rentals, ...payload.results];
			offset = startOffset + payload.results.length;
			hasMore = payload.has_more;
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
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
		furnishing = '';
		minPrice = '';
		maxPrice = '';
		liveOnly = true;
		sortBy = '';
		order = 'asc';
		void fetchRentals(true);
	}

	onMount(() => {
		void fetchRentals(true);
	});
</script>

<svelte:head>
	<title>Rentals | Ivy Homes</title>
	<meta name="description" content="Browse rental listings from the Ivy Homes API." />
</svelte:head>

<main
	class="mx-auto w-[min(76rem,calc(100%-3rem))] py-8 pb-16 max-[900px]:w-[calc(100%-3rem)] max-[560px]:w-[calc(100%-2rem)]"
>
	<header class="mb-10 flex items-end gap-8">
		<div>
			<a class="mb-8 block text-sm font-bold text-[#1e5b3a] no-underline" href={resolve('/')}
				>← Workspace</a
			>
			<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">RENTALS</p>
			<h1 class="m-0 text-[clamp(2.3rem,6vw,4.5rem)] leading-[.95] tracking-[-.06em]">
				Find your next home to rent.
			</h1>
		</div>
	</header>

	<div class="grid grid-cols-[16rem_minmax(0,1fr)] items-start gap-8 max-[900px]:grid-cols-1">
		<aside
			class="sticky top-6 grid gap-4 rounded-2xl border border-[#e1ddd4] bg-white p-4 max-[900px]:static"
			aria-label="Rental filters"
		>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Locality
				<input
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={locality}
					placeholder="e.g. t nagar"
					oninput={() => debounceFetchRentals(true)}
				/>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Property Type
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={propertyType}
					onchange={() => void fetchRentals(true)}
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
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={bedroom}
					onchange={() => void fetchRentals(true)}
				>
					<option value="">Any bedrooms</option>
					<option value="0">Studio</option>
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
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={furnishing}
					onchange={() => void fetchRentals(true)}
				>
					<option value="">Any furnishing</option>
					<option value="unfurnished">Unfurnished</option>
					<option value="semi-furnished">Semi-furnished</option>
					<option value="fully-furnished">Fully-furnished</option>
				</select>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Min rent
				<input
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={minPrice}
					type="number"
					min="0"
					placeholder="₹/month"
					oninput={() => debounceFetchRentals(true)}
				/>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Max rent
				<input
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={maxPrice}
					type="number"
					min="0"
					placeholder="₹/month"
					oninput={() => debounceFetchRentals(true)}
				/>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Sort by
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={sortBy}
					onchange={() => void fetchRentals(true)}
				>
					<option value="">Default</option>
					<option value="price">Rent</option>
					<option value="carpet_area">Carpet Area</option>
					<option value="posted_at">Posted At</option>
					<option value="bedroom">Bedroom</option>
				</select>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Order
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={order}
					onchange={() => void fetchRentals(true)}
				>
					<option value="asc">Ascending</option>
					<option value="desc">Descending</option>
				</select>
			</label>
			<label class="flex items-center gap-1.5 text-xs font-bold text-[#526058]">
				<input type="checkbox" bind:checked={liveOnly} onchange={() => void fetchRentals(true)} />
				Active only
			</label>
			<button
				class="clear cursor-pointer rounded-[.55rem] border-0 bg-[#e8eee9] px-4 py-3 font-inherit font-extrabold text-[#1e5b3a]"
				type="button"
				onclick={resetFilters}>Clear</button
			>
		</aside>

		<section class="min-w-0">
			{#if error}
				<p class="py-8 text-[#a3362d]" role="alert">{error}</p>
			{:else if loading}
				<p class="py-8 text-[#68746d]">Loading rentals…</p>
			{:else}
				{#if rentals.length === 0}
					<p class="py-8 text-[#68746d]">No rentals match these filters.</p>
				{:else}
					<section
						class="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1"
						aria-label="Rentals"
					>
						{#each rentals as rental (rental.listing_id)}
							<a
								class="grid gap-2.5 rounded-2xl border border-[#e1ddd4] bg-white p-5 text-inherit no-underline transition hover:-translate-y-0.5 hover:border-[#8bb699]"
								href={resolve(`/rentals/${rental.listing_id}`)}
							>
								<div class="flex justify-between text-xs font-extrabold text-[#557762]">
									<span class="tag rounded-md bg-[#e8eee9] px-2 py-1">{rental.bedroom} BHK</span>
									<span class={rental.is_live ? 'text-[#557762]' : 'text-[#a3362d]'}
										>{rental.is_live ? 'Live' : 'Inactive'}</span
									>
								</div>
								<h2 class="m-0 mt-2 text-xl">{rental.apartment_name}</h2>
								<p class="m-0 text-sm text-[#68746d]">{rental.locality} · {rental.property_type}</p>
								<strong class="mt-1 text-[1.35rem]"
									>₹{rental.price.toLocaleString('en-IN')}/month</strong
								>
								<p class="m-0 text-sm text-[#68746d]">
									Deposit ₹{rental.deposit.toLocaleString('en-IN')} · {rental.carpet_area.toLocaleString()}
									sq ft · {rental.furnishing}
								</p>
							</a>
						{/each}
					</section>
					{#if hasMore}
						<button
							class="load-more mx-auto mt-8 block cursor-pointer rounded-[.55rem] border-0 bg-[#1e5b3a] px-4 py-3 font-inherit font-extrabold text-white"
							type="button"
							disabled={loadingMore}
							onclick={() => void fetchRentals()}
						>
							{loadingMore ? 'Loading…' : 'Load more'}
						</button>
					{/if}
				{/if}
			{/if}
		</section>
	</div>
</main>
