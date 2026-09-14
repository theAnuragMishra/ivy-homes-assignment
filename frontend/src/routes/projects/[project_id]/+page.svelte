<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Project } from '../../api/projects/+server';

	let project = $state<Project | null>(null);
	let loading = $state(true);
	let error = $state('');
	let liveListingCount = $state<number | null>(null);

	let { data }: { data: { project_id: string } } = $props();

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
			const response = await fetch(`/api/projects/${encodeURIComponent(data.project_id)}`);
			const payload = await response.json();
			if (!response.ok) {
				error = payload.detail ?? 'Unable to load this project.';
				return;
			}
			project = payload as Project;
		} catch {
			error = 'Unable to reach the application server.';
		} finally {
			loading = false;
		}

		try {
			const response = await fetch(
				`/api/listings?project_id=${encodeURIComponent(data.project_id)}&is_live=true&limit=1`
			);
			if (!response.ok) return;
			const payload = await response.json();
			if (typeof payload?.total === 'number') liveListingCount = payload.total;
		} catch {
			// The project detail remains usable if the optional listing cross-check fails.
		}
	});
</script>

<svelte:head>
	<title>{project ? `${project.apartment_name} | Ivy Homes` : 'Project | Ivy Homes'}</title>
	<meta name="description" content="View complete project details on Ivy Homes." />
</svelte:head>

<main
	class="mx-auto w-[min(72rem,calc(100%-3rem))] py-8 pb-20 max-[900px]:w-[calc(100%-3rem)] max-[650px]:w-[calc(100%-2rem)]"
>
	<a class="font-bold text-[#1e5b3a] no-underline" href={resolve('/projects')}>← Back to projects</a
	>

	{#if loading}
		<p class="py-12 text-[#68746d]">Loading project…</p>
	{:else if error}
		<p class="py-12 text-[#a3362d]" role="alert">{error}</p>
	{:else if project}
		<article>
			<header
				class="my-16 flex items-end justify-between gap-12 max-[650px]:my-12 max-[650px]:block"
			>
				<div class="min-w-0">
					<div class="mb-4 flex gap-2">
						<span
							class="inline-flex items-center rounded-full bg-[#e8eee9] py-1 text-xs font-extrabold capitalize text-[#2c7548]"
							>{project.project_status}</span
						>
					</div>
					<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">
						{project.developer_name}
					</p>
					<h1 class="m-0 text-[clamp(2.5rem,7vw,5.5rem)] leading-[.92] tracking-[-.07em]">
						{project.apartment_name}
					</h1>
					<p class="mt-4 flex items-center gap-1 text-[#68746d]"><svg
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
										</svg>{project.locality}</p>
				</div>
				<div
					class="grid shrink-0 justify-items-end max-[650px]:mt-6 max-[650px]:justify-items-start"
				>
					<strong class="text-[clamp(1.4rem,3.5vw,2.4rem)] whitespace-nowrap"
						>₹{formatNumber(project.price_min)} – ₹{formatNumber(project.price_max)}</strong
					>
					<span class="text-xs text-[#7a837e]">Price range</span>
				</div>
			</header>

			<section
				class="grid grid-cols-6 overflow-hidden rounded-2xl border border-[#e1ddd4] bg-white max-[900px]:grid-cols-3 max-[650px]:grid-cols-2"
				aria-label="Project overview"
			>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>⌂</span
					>
					<div class="grid gap-1">
						<strong>{formatNumber(project.total_units)}</strong><span class="text-xs text-[#68746d]"
							>Total units</span
						>
					</div>
				</div>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>▥</span
					>
					<div class="grid gap-1">
						<strong>{formatNumber(project.total_towers)}</strong><span
							class="text-xs text-[#68746d]">Towers</span
						>
					</div>
				</div>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>↑</span
					>
					<div class="grid gap-1">
						<strong>{formatNumber(project.total_floors)}</strong><span
							class="text-xs text-[#68746d]">Floors</span
						>
					</div>
				</div>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>▣</span
					>
					<div class="grid gap-1">
						<strong
							>{formatNumber(project.min_area_sqft)}–{formatNumber(project.max_area_sqft)}</strong
						><span class="text-xs text-[#68746d]">Sq ft area</span>
					</div>
				</div>
				<div class="flex items-center gap-3 border-r border-[#ebe8e1] p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>₹</span
					>
					<div class="grid gap-1">
						<strong>{formatNumber(project.total_listings)}</strong><span
							class="text-xs text-[#68746d]">Reported listings</span
						>
					</div>
				</div>
				<div class="flex items-center gap-3 p-4">
					<span
						class="grid h-8 w-8 place-items-center rounded-lg bg-[#f0f4f0] font-extrabold text-[#306746]"
						>◷</span
					>
					<div class="grid gap-1">
						<strong>{formatDate(project.possession_date)}</strong><span
							class="text-xs text-[#68746d]">Possession</span
						>
					</div>
				</div>
			</section>

			<div
				class="mt-6 grid grid-cols-[minmax(0,1.6fr)_minmax(18rem,.8fr)] items-start gap-6 max-[900px]:grid-cols-1"
			>
				<div class="grid gap-6">
					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">Project amenities</h2>
						{#if project.amenities.length > 0}
							<ul class="m-0 flex list-none flex-wrap gap-2 p-0">
								{#each project.amenities as amenity (amenity)}
									<li
										class="rounded-lg bg-[#e8eee9] px-3 py-1.5 text-sm font-bold capitalize text-[#1e5b3a]"
									>
										{amenity}
									</li>
								{/each}
							</ul>
						{:else}
							<p class="m-0 leading-relaxed text-[#526058]">No amenities listed.</p>
						{/if}
					</section>

					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">Project details</h2>
						<div class="grid grid-cols-2 border-t border-[#ebe8e1] max-[650px]:grid-cols-1">
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Developer</span><strong class="text-sm"
									>{project.developer_name}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Project status</span><strong
									class="text-sm capitalize">{project.project_status}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Price minimum</span><strong class="text-sm"
									>₹{formatNumber(project.price_min)}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Price maximum</span><strong class="text-sm"
									>₹{formatNumber(project.price_max)}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Minimum area</span><strong class="text-sm"
									>{formatNumber(project.min_area_sqft)} sq ft</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Maximum area</span><strong class="text-sm"
									>{formatNumber(project.max_area_sqft)} sq ft</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Total units</span><strong class="text-sm"
									>{formatNumber(project.total_units)}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Total towers</span><strong class="text-sm"
									>{formatNumber(project.total_towers)}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Total floors</span><strong class="text-sm"
									>{formatNumber(project.total_floors)}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Reported listings</span><strong class="text-sm"
									>{formatNumber(project.total_listings)}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Launch date</span><strong class="text-sm"
									>{formatDate(project.launch_date)}</strong
								>
							</div>
							<div class="grid gap-1 border-b border-[#ebe8e1] py-4">
								<span class="text-xs text-[#7a837e]">Possession date</span><strong class="text-sm"
									>{formatDate(project.possession_date)}</strong
								>
							</div>
						</div>
					</section>

					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<div class="flex items-start justify-between gap-4 max-[650px]:block">
							<div>
								<h2 class="mb-1 text-xl">Location</h2>
								<p class="m-0 capitalize text-[#68746d]">{project.locality}</p>
							</div>
							{#if project.latitude && project.longitude}
								<a
									class="text-sm font-extrabold text-[#1e5b3a] no-underline max-[650px]:mt-3 max-[650px]:inline-block"
									href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
									target="_blank"
									rel="noreferrer">View on map ↗</a
								>
							{/if}
						</div>
						{#if project.latitude && project.longitude}
							<div
								class="mt-5 grid grid-cols-[auto_1fr] gap-2 border-t border-[#ebe8e1] pt-4 text-sm"
							>
								<span class="text-[#7a837e]">Latitude</span><strong>{project.latitude}</strong><span
									class="text-[#7a837e]">Longitude</span
								><strong>{project.longitude}</strong>
							</div>
						{/if}
					</section>
				</div>

				<aside class="grid gap-6 max-[900px]:grid-cols-2 max-[650px]:grid-cols-1">
					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">Listings</h2>
						{#if liveListingCount !== null}
							<p class="m-0 leading-relaxed text-[#526058]">
								{liveListingCount} live listing{liveListingCount === 1 ? '' : 's'}.
								<br />{project.total_listings} total listing{project.total_listings === 1
									? ''
									: 's'}.
							</p>
						{:else}
							<p class="m-0 leading-relaxed text-[#526058]">
								{project.total_listings} listing{project.total_listings === 1 ? '' : 's'} reported by
								the project record.
							</p>
						{/if}
					</section>

					<section class="rounded-2xl border border-[#e1ddd4] bg-white p-6">
						<h2 class="mb-4 text-xl">Project information</h2>
						<div class="grid">
							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">Project ID</span><strong
									class="break-words text-right text-xs">{project.project_id}</strong
								>
							</div>
							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">City ID</span><strong
									class="text-right text-xs">{project.city_id}</strong
								>
							</div>
							<div class="flex justify-between gap-4 border-t border-[#ebe8e1] py-3">
								<span class="text-xs text-[#7a837e]">RERA number</span><strong
									class="break-words text-right text-xs">{project.rera_number}</strong
								>
							</div>
						</div>
					</section>

					{#if project.project_url}
						<a
							class="block rounded-xl border border-[#d8d5cc] bg-white p-4 text-center text-sm font-extrabold text-[#1e5b3a] no-underline hover:bg-[#f8f7f3]"
							href={project.project_url}
							target="_blank"
							rel="noreferrer">View original project ↗</a
						>
					{/if}
				</aside>
			</div>
		</article>
	{/if}
</main>
