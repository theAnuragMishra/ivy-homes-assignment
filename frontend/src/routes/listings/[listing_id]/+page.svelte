<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Listing } from '../../api/listings/+server';
	import { isSaved, loadSaved, toggleSaved } from '$lib/saved-store.svelte';

	let listing = $state<Listing | null>(null);
	let loading = $state(true);
	let error = $state('');

	let { data }: { data: { listing_id: string } } = $props();

	const formatPrice = (price: number) => {
		if (price >= 10_000_000) {
			return `₹${(price / 10_000_000).toFixed(2)} Cr`;
		}

		if (price >= 100_000) {
			return `₹${(price / 100_000).toFixed(2)} L`;
		}

		return `₹${price.toLocaleString('en-IN')}`;
	};

	const formatNumber = (value: number | null | undefined) =>
		value == null ? '—' : value.toLocaleString('en-IN');

	const formatDate = (value: string) =>
		new Date(value).toLocaleDateString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});

	onMount(async () => {
		void loadSaved();

		try {
			const response = await fetch(`/api/listings/${encodeURIComponent(data.listing_id)}`);
			const payload = await response.json();

			if (!response.ok) {
				error = payload.detail ?? 'Unable to load this listing.';
				return;
			}

			listing = payload as Listing;
		} catch {
			error = 'Unable to reach the application server.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{listing ? `${listing.apartment_name} | Ivy Homes` : 'Listing | Ivy Homes'}</title>
</svelte:head>

<main
	class="mx-auto w-[min(72rem,calc(100%-3rem))] py-8 pb-20 max-[900px]:w-[calc(100%-3rem)] max-[650px]:w-[calc(100%-2rem)]"
>
	<a class="font-bold text-[#1e5b3a] no-underline" href={resolve('/listings')}>← Back to listings</a
	>

	{#if loading}
		<p class="py-12 text-[#68746d]">Loading listing…</p>
	{:else if error}
		<p class="py-12 text-[#a3362d]" role="alert">{error}</p>
	{:else if listing}
		<article>
			<!-- Header -->
			<header
				class="my-16 flex items-end justify-between gap-12 max-[650px]:my-12 max-[650px]:block"
			>
				<div class="min-w-0">
					<div class="mb-4 flex gap-2">
						{#if listing.is_verified}
							<span
								class="inline-flex items-center gap-1.5 rounded-full bg-[#e8f1ff] py-1 text-xs font-extrabold text-[#1d4ed8]"
								title="This listing has been verified"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									aria-hidden="true"
									class="h-4 w-4 fill-current"
								>
									<path
										d="M12 2.5 14.7 4l3.1-.1.9 3 2.3 2-1.1 2.9 1.1 2.9-2.3 2-.9 3-3.1-.1L12 21.5 9.3 20l-3.1.1-.9-3-2.3-2 1.1-2.9-1.1-2.9 2.3-2 .9-3 3.1.1L12 2.5Z"
									/>
									<path
										d="m8.2 12.2 2.4 2.4 5.2-5.2"
										fill="none"
										stroke="white"
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
									/>
								</svg>
								Verified listing
							</span>
						{/if}

						{#if listing.is_live}
							<span
								class="inline-flex items-center rounded-full bg-[#edf5ed] py-1 text-xs font-extrabold text-[#327144]"
								>● Live</span
							>
						{/if}
					</div>

					<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">
						{listing.bedroom} BHK · {listing.property_type}
					</p>

					<h1 class="m-0 text-[clamp(2.5rem,7vw,5.5rem)] leading-[.92] tracking-[-.07em]">
						{listing.apartment_name}
					</h1>

					<p class="mt-4 flex items-center gap-1 text-[#68746d]">
						<svg
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
						</svg>
						{listing.locality}
						{#if listing.facing_direction}
							<span class="text-[#b1b6b2]">·</span>
							{listing.facing_direction}-facing
						{/if}
					</p>
				</div>

				<div
					class="grid shrink-0 justify-items-end max-[650px]:mt-6 max-[650px]:justify-items-start"
				>
					<strong class="text-[clamp(1.8rem,4vw,2.75rem)] whitespace-nowrap"
						>{formatPrice(listing.price)}</strong
					>

					<span class="text-xs text-[#7a837e]">
						₹{listing.price.toLocaleString('en-IN')}
					</span>

					<button
						class="mt-3 cursor-pointer rounded-lg border border-[#d8d5cc] bg-white px-3 py-2 font-bold text-[#526058]"
						class:saved={isSaved(listing.listing_id)}
						type="button"
						onclick={() => void toggleSaved(listing!.listing_id)}
					>
						{isSaved(listing.listing_id) ? '★ Saved' : '☆ Save'}
					</button>
				</div>
			</header>

			<!-- Main property stats -->
			<section
				class="grid grid-cols-6 overflow-hidden rounded-2xl border border-[#e1ddd4] bg-white max-[900px]:grid-cols-3 max-[650px]:grid-cols-2"
				aria-label="Property overview"
			>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>⌂</span
					>
					<div class="grid gap-1">
						<strong>{listing.bedroom}</strong>
						<span class="text-xs text-[#68746d]">Bedrooms</span>
					</div>
				</div>

				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>♨</span
					>
					<div class="grid gap-1">
						<strong>{listing.bathroom}</strong>
						<span class="text-xs text-[#68746d]">Bathrooms</span>
					</div>
				</div>

				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>▣</span
					>
					<div class="grid gap-1">
						<strong>{formatNumber(listing.carpet_area)}</strong>
						<span class="text-xs text-[#68746d]">sq ft carpet</span>
					</div>
				</div>

				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>□</span
					>
					<div class="grid gap-1">
						<strong>{formatNumber(listing.super_built_up_area)}</strong>
						<span class="text-xs text-[#68746d]">sq ft built-up</span>
					</div>
				</div>

				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>P</span
					>
					<div class="grid gap-1">
						<strong>{listing.covered_parking}</strong>
						<span class="text-xs text-[#68746d]">Covered parking</span>
					</div>
				</div>

				<div class="flex items-center gap-3 p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>↑</span
					>
					<div class="grid gap-1">
						<strong>{listing.floor} / {listing.total_floors}</strong>
						<span class="text-xs text-[#68746d]">Floor</span>
					</div>
				</div>
			</section>

			<!-- Content -->
			<div
				class="mt-6 grid grid-cols-[minmax(0,1.6fr)_minmax(18rem,.8fr)] items-start gap-6 max-[900px]:grid-cols-1"
			>
				<div class="grid gap-6">
					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">About this property</h2>
						<p class="m-0 leading-relaxed text-[#526058]">{listing.description}</p>
					</section>

					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">Property details</h2>

						<div class="grid grid-cols-2 border-t border-[#ebe8e1] max-[650px]:grid-cols-1">
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Property type</span>
								<strong class="text-sm capitalize">{listing.property_type}</strong>
							</div>

							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Furnishing</span>
								<strong class="text-sm capitalize">{listing.furnishing}</strong>
							</div>

							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Facing</span>
								<strong class="text-sm capitalize">{listing.facing_direction || '—'}</strong>
							</div>

							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Balcony</span>
								<strong class="text-sm">{listing.balcony}</strong>
							</div>

							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Bedrooms</span>
								<strong class="text-sm">{listing.bedroom}</strong>
							</div>

							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Bathrooms</span>
								<strong class="text-sm">{listing.bathroom}</strong>
							</div>

							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Carpet area</span>
								<strong class="text-sm">{formatNumber(listing.carpet_area)} sq ft</strong>
							</div>

							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Super built-up area</span>
								<strong class="text-sm">{formatNumber(listing.super_built_up_area)} sq ft</strong>
							</div>

							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Floor</span>
								<strong class="text-sm">{listing.floor} of {listing.total_floors}</strong>
							</div>

							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Covered parking</span>
								<strong class="text-sm">{listing.covered_parking}</strong>
							</div>
						</div>
					</section>

					<!-- Location -->
					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<div class="flex items-start justify-between gap-4 max-[650px]:block">
							<div>
								<h2 class="mb-1 text-xl">Location</h2>
								<p class="m-0 capitalize text-[#68746d]">{listing.locality}</p>
							</div>

							{#if listing.latitude && listing.longitude}
								<a
									class="text-sm font-extrabold text-[#1e5b3a] no-underline max-[650px]:mt-3 max-[650px]:inline-block"
									href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
									target="_blank"
									rel="noreferrer"
								>
									View on map ↗
								</a>
							{/if}
						</div>

						{#if listing.latitude && listing.longitude}
							<div
								class="mt-5 grid grid-cols-[auto_1fr] gap-2 border-t border-[#ebe8e1] pt-4 text-sm"
							>
								<span class="text-[#7a837e]">Latitude</span>
								<strong>{listing.latitude}</strong>

								<span class="text-[#7a837e]">Longitude</span>
								<strong>{listing.longitude}</strong>
							</div>
						{/if}
					</section>
				</div>

				<!-- Sidebar -->
				<aside class="grid gap-6 max-[900px]:grid-cols-2 max-[650px]:grid-cols-1">
					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<div class="mb-2 text-[.68rem] font-extrabold tracking-[.12em] text-[#7a837e]">
							LISTED BY
						</div>

						<h2 class="mb-1 text-xl">{listing.posted_by_name}</h2>

						<p class="mb-5 text-sm capitalize text-[#68746d]">
							{listing.posted_by === 'agent' ? 'Property Agent' : listing.posted_by}
						</p>

						<a
							class="flex items-center gap-2 font-bold text-[#1e2924] no-underline"
							href={`tel:${listing.posted_by_contact}`}
						>
							<span>☎</span>
							{listing.posted_by_contact}
						</a>

						<a
							class="mt-5 block rounded-lg bg-[#1e5b3a] p-3 text-center text-sm font-extrabold text-white no-underline hover:bg-[#17472d]"
							href={`tel:${listing.posted_by_contact}`}
						>
							Contact seller
						</a>
					</section>

					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">Listing information</h2>

						<div class="grid">
							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Listing ID</span>
								<strong class="break-words text-right text-xs">{listing.listing_id}</strong>
							</div>

							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Posted</span>
								<strong class="break-words text-right text-xs"
									>{formatDate(listing.posted_at)}</strong
								>
							</div>

							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Status</span>
								<strong class={`text-right text-xs ${listing.is_live ? 'text-[#2c7548]' : ''}`}>
									{listing.is_live ? 'Active' : 'Inactive'}
								</strong>
							</div>

							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Verification</span>
								<strong class={`text-right text-xs ${listing.is_verified ? 'text-[#2c7548]' : ''}`}>
									{listing.is_verified ? 'Verified listing' : 'Not verified'}
								</strong>
							</div>

							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Source</span>
								<strong class="break-words text-right text-xs">{listing.website}</strong>
							</div>
						</div>
					</section>

					{#if listing.listing_url}
						<a
							class="block rounded-xl border border-[#d8d5cc] bg-white p-4 text-center text-sm font-extrabold text-[#1e5b3a] no-underline hover:bg-[#f8f7f3]"
							rel="external noreferrer"
							href={listing.listing_url}
							target="_blank"
						>
							View original listing ↗
						</a>
					{/if}
				</aside>
			</div>
		</article>
	{/if}
</main>
