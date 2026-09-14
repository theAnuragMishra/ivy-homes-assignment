<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Rental } from '../../api/rentals/+server';

	let rental = $state<Rental | null>(null);
	let loading = $state(true);
	let error = $state('');

	let { data }: { data: { listing_id: string } } = $props();

	const formatNumber = (value: number | null | undefined) =>
		value == null ? '—' : value.toLocaleString('en-IN');

	const formatDate = (value: string) =>
		new Date(value).toLocaleDateString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});

	onMount(async () => {
		try {
			const response = await fetch(`/api/rentals/${encodeURIComponent(data.listing_id)}`);
			const payload = await response.json();

			if (!response.ok) {
				error = payload.detail ?? 'Unable to load this rental.';
				return;
			}

			rental = payload as Rental;
		} catch {
			error = 'Unable to reach the application server.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{rental ? `${rental.apartment_name} | Ivy Homes` : 'Rental | Ivy Homes'}</title>
	<meta name="description" content="View rental property details on Ivy Homes." />
</svelte:head>

<main
	class="mx-auto w-[min(72rem,calc(100%-3rem))] py-8 pb-20 max-[900px]:w-[calc(100%-3rem)] max-[650px]:w-[calc(100%-2rem)]"
>
	<a class="font-bold text-[#1e5b3a] no-underline" href={resolve('/rentals')}>← Back to rentals</a>

	{#if loading}
		<p class="py-12 text-[#68746d]">Loading rental…</p>
	{:else if error}
		<p class="py-12 text-[#a3362d]" role="alert">{error}</p>
	{:else if rental}
		<article>
			<header
				class="my-16 flex items-end justify-between gap-12 max-[650px]:my-12 max-[650px]:block"
			>
				<div class="min-w-0">
					<div class="mb-4 flex gap-2">
						{#if rental.is_live}
							<span
								class="inline-flex items-center rounded-full bg-[#edf5ed] py-1 text-xs font-extrabold text-[#327144]"
								>● Live</span
							>
						{:else}
							<span
								class="inline-flex items-center rounded-full bg-[#f8e9e6] px-2.5 py-1 text-xs font-extrabold text-[#a3362d]"
								>● Inactive</span
							>
						{/if}
					</div>

					<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">
						{rental.bedroom > 0 ? `${rental.bedroom} BHK` : 'Studio'} · {rental.property_type}
					</p>

					<h1 class="m-0 text-[clamp(2.5rem,7vw,5.5rem)] leading-[.92] tracking-[-.07em]">
						{rental.apartment_name}
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
						{rental.locality}
						{#if rental.facing_direction}
							<span class="text-[#b1b6b2]">·</span>
							{rental.facing_direction}-facing
						{/if}
					</p>
				</div>

				<div
					class="grid shrink-0 justify-items-end max-[650px]:mt-6 max-[650px]:justify-items-start"
				>
					<strong class="text-[clamp(1.8rem,4vw,2.75rem)] whitespace-nowrap"
						>₹{rental.price.toLocaleString('en-IN')}/month</strong
					>
					<span class="text-xs text-[#7a837e]"
						>Deposit ₹{rental.deposit.toLocaleString('en-IN')}</span
					>
					<span class="text-xs text-[#7a837e]"
						>Maintenance ₹{rental.maintenance.toLocaleString('en-IN')}/month</span
					>
				</div>
			</header>

			<section
				class="grid grid-cols-6 overflow-hidden rounded-2xl border border-[#e1ddd4] bg-white max-[900px]:grid-cols-3 max-[650px]:grid-cols-2"
				aria-label="Rental overview"
			>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>⌂</span
					>
					<div class="grid gap-1">
						<strong>{rental.bedroom > 0 ? rental.bedroom : 'Studio'}</strong><span
							class="text-xs text-[#68746d]">Bedrooms</span
						>
					</div>
				</div>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>♨</span
					>
					<div class="grid gap-1">
						<strong>{rental.bathroom}</strong><span class="text-xs text-[#68746d]">Bathrooms</span>
					</div>
				</div>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>▣</span
					>
					<div class="grid gap-1">
						<strong>{formatNumber(rental.carpet_area)}</strong><span class="text-xs text-[#68746d]"
							>sq ft carpet</span
						>
					</div>
				</div>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>□</span
					>
					<div class="grid gap-1">
						<strong>{formatNumber(rental.super_builtup_area)}</strong><span
							class="text-xs text-[#68746d]">sq ft built-up</span
						>
					</div>
				</div>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>₹</span
					>
					<div class="grid gap-1">
						<strong>₹{formatNumber(rental.deposit)}</strong><span class="text-xs text-[#68746d]"
							>Deposit</span
						>
					</div>
				</div>
				<div class="flex items-center gap-3 p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>↑</span
					>
					<div class="grid gap-1">
						<strong>{rental.floor} / {rental.total_floors}</strong><span
							class="text-xs text-[#68746d]">Floor</span
						>
					</div>
				</div>
			</section>

			<div
				class="mt-6 grid grid-cols-[minmax(0,1.6fr)_minmax(18rem,.8fr)] items-start gap-6 max-[900px]:grid-cols-1"
			>
				<div class="grid gap-6">
					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">About this rental</h2>
						<p class="m-0 leading-relaxed text-[#526058]">{rental.description}</p>
					</section>

					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">Rental details</h2>
						<div class="grid grid-cols-2 border-t border-[#ebe8e1] max-[650px]:grid-cols-1">
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Property type</span><strong
									class="text-sm capitalize">{rental.property_type}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Furnishing</span><strong
									class="text-sm capitalize">{rental.furnishing}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Facing</span><strong class="text-sm capitalize"
									>{rental.facing_direction || '—'}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Bedrooms</span><strong class="text-sm"
									>{rental.bedroom}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Bathrooms</span><strong class="text-sm"
									>{rental.bathroom}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Carpet area</span><strong class="text-sm"
									>{formatNumber(rental.carpet_area)} sq ft</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Super built-up area</span><strong
									class="text-sm">{formatNumber(rental.super_builtup_area)} sq ft</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Floor</span><strong class="text-sm"
									>{rental.floor} of {rental.total_floors}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Monthly rent</span><strong class="text-sm"
									>₹{formatNumber(rental.price)}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Maintenance</span><strong class="text-sm"
									>₹{formatNumber(rental.maintenance)} / month</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Security deposit</span><strong class="text-sm"
									>₹{formatNumber(rental.deposit)}</strong
								>
							</div>
						</div>
					</section>

					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<div class="flex items-start justify-between gap-4 max-[650px]:block">
							<div>
								<h2 class="mb-1 text-xl">Location</h2>
								<p class="m-0 capitalize text-[#68746d]">{rental.locality}</p>
							</div>
							{#if rental.latitude && rental.longitude}
								<a
									class="text-sm font-extrabold text-[#1e5b3a] no-underline max-[650px]:mt-3 max-[650px]:inline-block"
									href={`https://www.google.com/maps?q=${rental.latitude},${rental.longitude}`}
									target="_blank"
									rel="noreferrer">View on map ↗</a
								>
							{/if}
						</div>
						{#if rental.latitude && rental.longitude}
							<div
								class="mt-5 grid grid-cols-[auto_1fr] gap-2 border-t border-[#ebe8e1] pt-4 text-sm"
							>
								<span class="text-[#7a837e]">Latitude</span><strong>{rental.latitude}</strong>
								<span class="text-[#7a837e]">Longitude</span><strong>{rental.longitude}</strong>
							</div>
						{/if}
					</section>
				</div>

				<aside class="grid gap-6 max-[900px]:grid-cols-2 max-[650px]:grid-cols-1">
					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<div class="mb-2 text-[.68rem] font-extrabold tracking-[.12em] text-[#7a837e]">
							LISTED BY
						</div>
						<h2 class="mb-1 text-xl">{rental.posted_by_name}</h2>
						<p class="mb-5 text-sm capitalize text-[#68746d]">
							{rental.posted_by === 'agent' ? 'Property Agent' : rental.posted_by}
						</p>
						<a
							class="flex items-center gap-2 font-bold text-[#1e2924] no-underline"
							href={`tel:${rental.posted_by_contact}`}><span>☎</span>{rental.posted_by_contact}</a
						>
						<a
							class="mt-5 block rounded-lg bg-[#1e5b3a] p-3 text-center text-sm font-extrabold text-white no-underline hover:bg-[#17472d]"
							href={`tel:${rental.posted_by_contact}`}>Contact landlord</a
						>
					</section>

					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">Listing information</h2>
						<div class="grid">
							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Listing ID</span><strong
									class="break-words text-right text-xs">{rental.listing_id}</strong
								>
							</div>
							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Posted</span><strong
									class="break-words text-right text-xs">{formatDate(rental.posted_at)}</strong
								>
							</div>
							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Status</span><strong
									class={`text-right text-xs ${rental.is_live ? 'text-[#2c7548]' : 'text-[#a3362d]'}`}
									>{rental.is_live ? 'Active' : 'Inactive'}</strong
								>
							</div>
							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Source</span><strong
									class="break-words text-right text-xs">{rental.website}</strong
								>
							</div>
						</div>
					</section>

					{#if rental.listing_url}
						<a
							class="block rounded-xl border border-[#d8d5cc] bg-white p-4 text-center text-sm font-extrabold text-[#1e5b3a] no-underline hover:bg-[#f8f7f3]"
							rel="external noreferrer"
							href={rental.listing_url}
							target="_blank">View original listing ↗</a
						>
					{/if}
				</aside>
			</div>
		</article>
	{/if}
</main>
