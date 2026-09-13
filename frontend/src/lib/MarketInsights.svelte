<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { MarketInsight } from '$lib/server/market-insights';

	let data = $state<MarketInsight | null>(null);
	let loading = $state(true);
	let error = $state('');

	const money = (value: number) =>
		value >= 10_000_000
			? `₹${(value / 10_000_000).toFixed(2)} Cr`
			: value >= 100_000
				? `₹${(value / 100_000).toFixed(1)} L`
				: `₹${value.toLocaleString('en-IN')}`;
	const number = (value: number) => value.toLocaleString('en-IN');
	const width = (value: number, max: number) => `${max ? Math.max(5, (value / max) * 100) : 5}%`;
	const titleCase = (value: string) => value.replace(/\b\w/g, (letter) => letter.toUpperCase());

	onMount(async () => {
		try {
			const response = await fetch('/api/market-insights');
			const payload = await response.json();
			if (!response.ok) {
				error = payload.detail ?? 'Unable to load market insights.';
				return;
			}
			data = payload as MarketInsight;
		} catch {
			error = 'Unable to reach the application server.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Market insights | Ivy Homes</title>
	<meta
		name="description"
		content="Explore the Ivy Homes property market by inventory, pricing, locality, and property type."
	/>
</svelte:head>

<main
	class="mx-auto w-[min(76rem,calc(100%-3rem))] pb-20 max-[900px]:w-[calc(100%-3rem)] max-[560px]:w-[calc(100%-2rem)]"
>
	<header class="my-16 flex items-end justify-between gap-10 max-[700px]:my-12 max-[700px]:block">
		<div class="max-w-3xl">
			<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">
				THE PROPERTY MARKET
			</p>
			<h1 class="m-0 text-[clamp(2.8rem,7vw,6rem)] leading-[.9] tracking-[-.07em]">
				A clearer view of your next move.
			</h1>
			<p class="mt-6 max-w-2xl text-lg leading-relaxed text-[#68746d]">
				Explore the scale of the market across sale listings, rentals, and new projects so you can
				compare options with confidence.
			</p>
		</div>
		<div class="max-w-48 rounded-2xl bg-[#1e5b3a] p-5 text-white max-[700px]:mt-8">
			<span class="text-xs font-bold uppercase tracking-[.12em] text-[#b8d6be]">Coverage</span
			><strong class="mt-2 block text-4xl"
				>{data ? number(data.overview.totalLocalities) : '—'}</strong
			><span class="text-sm text-[#d9ebdc]">localities represented</span>
		</div>
	</header>

	{#if loading}
		<p class="py-12 text-[#68746d]">Preparing the market overview…</p>
	{:else if error}
		<p class="py-12 text-[#a3362d]" role="alert">{error}</p>
	{:else if data}
		<section
			class="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1"
			aria-label="Market inventory"
		>
			<div class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
				<span class="text-sm font-bold text-[#68746d]">For sale</span><strong
					class="mt-3 block text-4xl tracking-[-.05em]"
					>{number(data.overview.totalListings)}</strong
				><span class="mt-1 block text-sm text-[#68746d]"
					>{number(data.overview.activeListings)} currently active</span
				>
			</div>
			<div class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
				<span class="text-sm font-bold text-[#68746d]">For rent</span><strong
					class="mt-3 block text-4xl tracking-[-.05em]">{number(data.overview.totalRentals)}</strong
				><span class="mt-1 block text-sm text-[#68746d]">monthly rental options</span>
			</div>
			<div class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
				<span class="text-sm font-bold text-[#68746d]">New projects</span><strong
					class="mt-3 block text-4xl tracking-[-.05em]"
					>{number(data.overview.totalProjects)}</strong
				><span class="mt-1 block text-sm text-[#68746d]"
					>{number(data.overview.totalBuilders)} developers</span
				>
			</div>
			<div class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
				<span class="text-sm font-bold text-[#68746d]">Property reach</span><strong
					class="mt-3 block text-4xl tracking-[-.05em]"
					>{number(data.overview.totalLocalities)}</strong
				><span class="mt-1 block text-sm text-[#68746d]">distinct localities</span>
			</div>
		</section>

		<section class="mt-10 rounded-2xl border border-[#e1ddd4] bg-white p-6">
			<div class="mb-7">
				<p class="mb-2 text-xs font-extrabold tracking-[.16em] text-[#557762]">MARKET ANALYTICS</p>
				<h2 class="m-0 text-2xl tracking-[-.04em]">The numbers behind the market.</h2>
				
			</div>
			<div class="mb-8 grid grid-cols-3 gap-4 max-[700px]:grid-cols-1">
				<div class="rounded-xl bg-[#f8f7f3] p-5">
					<span class="text-sm text-[#68746d]">Total listings</span>
					<strong class="mt-2 block text-3xl">{number(data.analytics.total_listings)}</strong>
					
				</div>
				<div class="rounded-xl bg-[#f8f7f3] p-5">
					<span class="text-sm text-[#68746d]">Median listing price</span>
					<strong class="mt-2 block text-3xl">{money(data.analytics.median_price)}</strong>
					
				</div>
				<div class="rounded-xl bg-[#f8f7f3] p-5">
					<span class="text-sm text-[#68746d]">Median price / sq ft</span>
					<strong class="mt-2 block text-3xl">{money(data.analytics.median_price_per_sqft)}</strong>
					
				</div>
			</div>
			<div class="grid grid-cols-2 gap-8 max-[800px]:grid-cols-1">
				<div>
					<h3 class="mb-4 text-lg">Locality breakdown</h3>
					<div class="overflow-hidden rounded-xl border border-[#ebe8e1]">
						<div class="grid grid-cols-[1fr_auto_auto] gap-4 bg-[#f8f7f3] px-4 py-3 text-xs font-extrabold uppercase tracking-[.08em] text-[#7a837e]">
							<span>Locality</span><span>Listings</span><span>Median price</span>
						</div>
						{#each data.analytics.by_locality.slice(0, 8) as locality (locality.locality)}
							<div class="grid grid-cols-[1fr_auto_auto] gap-4 border-t border-[#ebe8e1] px-4 py-3 text-sm">
								<span class="capitalize">{locality.locality}</span>
								<span class="text-[#68746d]">{number(locality.count)}</span>
								<strong>{money(locality.median_price)}</strong>
							</div>
						{/each}
					</div>
				</div>
				<div>
					<h3 class="mb-4 text-lg">Bedroom breakdown</h3>
					<div class="grid gap-4">
						{#each data.analytics.by_bhk as bedroom (bedroom.bedroom)}
							<div>
								<div class="mb-1 flex justify-between text-sm">
									<span class="font-bold">{bedroom.bedroom === 0 ? 'Plots / studio' : `${bedroom.bedroom} BHK`}</span>
									<span class="text-[#68746d]">{number(bedroom.count)}</span>
								</div>
								<div class="h-3 rounded-full bg-[#edf1ed]">
									<div
										class="h-3 rounded-full bg-[#6c82a7]"
										style={`width: ${width(bedroom.count, Math.max(...data.analytics.by_bhk.map((b) => b.count)))}`}
									></div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<section class="mt-10 grid grid-cols-[1.2fr_.8fr] gap-6 max-[800px]:grid-cols-1">
			<div class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
				<div class="mb-8">
					<p class="mb-2 text-xs font-extrabold tracking-[.16em] text-[#557762]">PRICE SNAPSHOT</p>
					<h2 class="m-0 text-2xl tracking-[-.04em]">Find the range that fits.</h2>
				</div>
				<div class="grid gap-6">
					<div>
						<div class="mb-2 flex justify-between text-sm">
							<span class="font-bold">Sale listings</span><span class="text-[#68746d]"
								>{money(data.prices.sale.min)} – {money(data.prices.sale.max)}</span
							>
						</div>
						<div class="h-3 rounded-full bg-[#edf1ed]">
							<div
								class="h-3 rounded-full bg-[#1e5b3a]"
								style={`width: ${width(data.prices.sale.average, data.prices.sale.max)}`}
							></div>
						</div>
						<p class="mt-2 mb-0 text-xs text-[#68746d]">
							Average {money(data.prices.sale.average)}
						</p>
					</div>
					<div>
						<div class="mb-2 flex justify-between text-sm">
							<span class="font-bold">Monthly rentals</span><span class="text-[#68746d]"
								>{money(data.prices.rent.min)} – {money(data.prices.rent.max)}</span
							>
						</div>
						<div class="h-3 rounded-full bg-[#edf1ed]">
							<div
								class="h-3 rounded-full bg-[#c78b35]"
								style={`width: ${width(data.prices.rent.average, data.prices.rent.max)}`}
							></div>
						</div>
						<p class="mt-2 mb-0 text-xs text-[#68746d]">
							Average {money(data.prices.rent.average)} / month
						</p>
					</div>
					<div>
						<div class="mb-2 flex justify-between text-sm">
							<span class="font-bold">Project prices</span><span class="text-[#68746d]"
								>{money(data.prices.project.min)} – {money(data.prices.project.max)}</span
							>
						</div>
						<div class="h-3 rounded-full bg-[#edf1ed]">
							<div
								class="h-3 rounded-full bg-[#6c82a7]"
								style={`width: ${width(data.prices.project.average, data.prices.project.max)}`}
							></div>
						</div>
						<p class="mt-2 mb-0 text-xs text-[#68746d]">
							Average maximum price {money(data.prices.project.average)}
						</p>
					</div>
				</div>
			</div>
			<div class="rounded-2xl bg-[#f1eee7] p-6">
				<p class="mb-2 text-xs font-extrabold tracking-[.16em] text-[#557762]">SPACE TO LIVE</p>
				<h2 class="m-0 text-2xl tracking-[-.04em]">
					Homes across {number(data.area.min)}–{number(data.area.max)} sq ft.
				</h2>
				<p class="mt-5 leading-relaxed text-[#526058]">
					The average listed carpet area is <strong>{number(data.area.average)} sq ft</strong>. Use
					the listings filters to narrow this broad market to the size and lifestyle you want.
				</p>
				<a
					class="mt-4 inline-block font-bold text-[#1e5b3a] no-underline"
					href={resolve('/listings')}>Browse sale homes →</a
				>
			</div>
		</section>

		<section class="mt-10 grid grid-cols-2 gap-6 max-[800px]:grid-cols-1">
			<div class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
				<div class="mb-7">
					<p class="mb-2 text-xs font-extrabold tracking-[.16em] text-[#557762]">
						LOCALITY COVERAGE
					</p>
					<h2 class="m-0 text-2xl tracking-[-.04em]">Where the market is concentrated.</h2>
				</div>
				<div class="grid gap-4">
					{#each data.localities as locality, index (index)}<div>
							<div class="mb-1 flex justify-between gap-4 text-sm">
								<span class="font-bold capitalize">{index + 1}. {locality.name}</span><span
									class="text-[#68746d]"
									>{number(locality.listings + locality.rentals + locality.projects)}</span
								>
							</div>
							<div class="h-2 rounded-full bg-[#edf1ed]">
								<div
									class="h-2 rounded-full bg-[#557762]"
									style={`width: ${width(locality.listings + locality.rentals + locality.projects, data.localities[0].listings + data.localities[0].rentals + data.localities[0].projects)}`}
								></div>
							</div>
							<p class="mt-1 mb-0 text-xs text-[#8a928c]">
								{number(locality.listings)} sale · {number(locality.rentals)} rent · {number(
									locality.projects
								)} projects
							</p>
						</div>{/each}
				</div>
			</div>
			<div class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
				<div class="mb-7">
					<p class="mb-2 text-xs font-extrabold tracking-[.16em] text-[#557762]">HOME TYPES</p>
					<h2 class="m-0 text-2xl tracking-[-.04em]">Something for every stage.</h2>
				</div>
				<div class="grid gap-5">
					{#each data.bedrooms as bedroom, i (i)}<div>
							<div class="mb-1 flex justify-between text-sm">
								<span class="font-bold">{bedroom.label}</span><span class="text-[#68746d]"
									>{number(bedroom.count)}</span
								>
							</div>
							<div class="h-3 rounded-full bg-[#edf1ed]">
								<div
									class="h-3 rounded-full bg-[#c78b35]"
									style={`width: ${width(bedroom.count, data.bedrooms[0].count)}`}
								></div>
							</div>
						</div>{/each}
				</div>
				<div class="mt-8 border-t border-[#ebe8e1] pt-6">
					<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">PROPERTY TYPES</p>
					<div class="flex flex-wrap gap-2">
						{#each data.propertyTypes as type, i (i)}<span
								class="rounded-full bg-[#edf1ed] px-3 py-1.5 text-sm capitalize text-[#1e5b3a]"
								>{titleCase(type.label)} · {number(type.count)}</span
							>{/each}
					</div>
				</div>
			</div>
		</section>

		<section class="mt-10 rounded-2xl border border-[#e1ddd4] bg-white p-6">
			<div class="mb-7">
				<p class="mb-2 text-xs font-extrabold tracking-[.16em] text-[#557762]">NEW DEVELOPMENT</p>
				<h2 class="m-0 text-2xl tracking-[-.04em]">Projects at every stage.</h2>
			</div>
			<div class="grid grid-cols-3 gap-4 max-[600px]:grid-cols-1">
				{#each data.projectStatuses as status, i (i)}<div class="rounded-xl bg-[#f8f7f3] p-5">
						<strong class="block text-3xl">{number(status.count)}</strong><span
							class="mt-2 block text-sm capitalize text-[#68746d]">{status.label}</span
						>
					</div>{/each}
			</div>
			<div class="mt-6 flex flex-wrap gap-4 text-sm text-[#68746d]">
				<a class="font-bold text-[#1e5b3a] no-underline" href={resolve('/projects')}
					>Explore projects →</a
				><a class="font-bold text-[#1e5b3a] no-underline" href={resolve('/rentals')}
					>See rental options →</a
				>
			</div>
		</section>
	{/if}
</main>
