<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Project, ProjectCollection } from '../api/projects/+server';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import RangeSlider from '$lib/RangeSlider.svelte';

	let projects = $state<Project[]>([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state('');
	let hasMore = $state(false);
	let offset = $state(0);
	let locality = $state('');
	let developer = $state('');
	let projectStatus = $state('');
	const budgetMin = 0;
	const budgetMax = 1_000_000_000;
	const areaMin = 0;
	const areaMax = 10_000;
	const unitsMin = 0;
	const unitsMax = 5_000;
	const towersMin = 0;
	const towersMax = 100;
	let minPrice = $state(budgetMin);
	let maxPrice = $state(budgetMax);
	let minArea = $state(areaMin);
	let maxArea = $state(areaMax);
	let minUnits = $state(unitsMin);
	let maxUnits = $state(unitsMax);
	let minTowers = $state(towersMin);
	let maxTowers = $state(towersMax);
	let sortBy = $state('launch_date');
	let order = $state('desc');

	function buildQuery(startOffset: number) {
		const params = new SvelteURLSearchParams({
			limit: '24',
			offset: String(startOffset),
			sort_by: sortBy,
			order
		});
		if (locality) params.set('locality', locality.trim().toLowerCase());
		if (developer) params.set('developer', developer.trim().toLowerCase());
		if (projectStatus) params.set('project_status', projectStatus);
		if (minPrice > budgetMin) params.set('min_price', String(minPrice));
		if (maxPrice < budgetMax) params.set('max_price', String(maxPrice));
		if (minArea > areaMin) params.set('min_area', String(minArea));
		if (maxArea < areaMax) params.set('max_area', String(maxArea));
		if (minUnits > unitsMin) params.set('min_units', String(minUnits));
		if (maxUnits < unitsMax) params.set('max_units', String(maxUnits));
		if (minTowers > towersMin) params.set('min_towers', String(minTowers));
		if (maxTowers < towersMax) params.set('max_towers', String(maxTowers));
		return params;
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	let searchController: AbortController | null = null;

	function debounceFetchProjects(reset = false) {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			void fetchProjects(reset);
		}, 300);
	}

	async function fetchProjects(reset = false) {
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
			const response = await fetch(`/api/projects?${buildQuery(startOffset)}`, {
				signal: controller?.signal
			});
			const payload = (await response.json()) as ProjectCollection | { detail?: string };
			if (!response.ok || !('results' in payload)) {
				error =
					'detail' in payload
						? (payload.detail ?? 'Unable to load projects.')
						: 'Unable to load projects.';
				return;
			}
			projects = reset ? payload.results : [...projects, ...payload.results];
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
		developer = '';
		projectStatus = '';
		minPrice = budgetMin;
		maxPrice = budgetMax;
		minArea = areaMin;
		maxArea = areaMax;
		minUnits = unitsMin;
		maxUnits = unitsMax;
		minTowers = towersMin;
		maxTowers = towersMax;
		sortBy = 'launch_date';
		order = 'desc';
		void fetchProjects(true);
	}

	onMount(() => {
		void fetchProjects(true);
	});
</script>

<svelte:head>
	<title>Projects | Ivy Homes</title>
	<meta name="description" content="Browse developer projects from the Ivy Homes API." />
</svelte:head>

<main
	class="mx-auto w-[min(76rem,calc(100%-3rem))] py-8 pb-16 max-[900px]:w-[calc(100%-3rem)] max-[560px]:w-[calc(100%-2rem)]"
>
	<header class="mb-10 flex items-end gap-8">
		<div>
			<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">DEVELOPER PROJECTS</p>
			<h1 class="m-0 text-[clamp(2.3rem,6vw,4.5rem)] leading-[.95] tracking-[-.06em]">
				Browse upcoming projects.
			</h1>
		</div>
	</header>

	<div class="grid grid-cols-[16rem_minmax(0,1fr)] items-start gap-8 max-[900px]:grid-cols-1">
		<aside
			class="sticky top-6 grid gap-4 rounded-2xl border border-[#e1ddd4] bg-white p-4 max-[900px]:static"
			aria-label="Project filters"
		>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Locality
				<input
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={locality}
					placeholder="e.g. perungudi"
					oninput={() => debounceFetchProjects(true)}
				/>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Project status
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={projectStatus}
					onchange={() => void fetchProjects(true)}
				>
					<option value="">Any status</option>
					<option value="new launch">New launch</option>
					<option value="under construction">Under construction</option>
					<option value="ready to move">Ready to move</option>
				</select>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Developer
				<input
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={developer}
					placeholder="e.g. Prestige"
					oninput={() => debounceFetchProjects(true)}
				/>
			</label>
			<RangeSlider
				label="Budget"
				min={budgetMin}
				max={budgetMax}
				step={10_000_000}
				bind:lower={minPrice}
				bind:upper={maxPrice}
				format={(value) => `${(value / 10_000_000).toFixed(0)}Cr`}
				onChange={() => debounceFetchProjects(true)}
			/>
			<RangeSlider
				label="Area"
				min={areaMin}
				max={areaMax}
				step={100}
				bind:lower={minArea}
				bind:upper={maxArea}
				format={(value) => `${value.toLocaleString('en-IN')} sq ft`}
				onChange={() => debounceFetchProjects(true)}
			/>
			<RangeSlider
				label="Units"
				min={unitsMin}
				max={unitsMax}
				step={50}
				bind:lower={minUnits}
				bind:upper={maxUnits}
				onChange={() => debounceFetchProjects(true)}
			/>
			<RangeSlider
				label="Towers"
				min={towersMin}
				max={towersMax}
				step={1}
				bind:lower={minTowers}
				bind:upper={maxTowers}
				onChange={() => debounceFetchProjects(true)}
			/>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Sort by
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={sortBy}
					onchange={() => void fetchProjects(true)}
				>
					<option value="launch_date">Launch date</option>
					<option value="price_min">Min price</option>
					<option value="price_max">Max price</option>
					<option value="total_units">Total units</option>
				</select>
			</label>
			<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
				Order
				<select
					class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
					bind:value={order}
					onchange={() => void fetchProjects(true)}
				>
					<option value="desc">Descending</option>
					<option value="asc">Ascending</option>
				</select>
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
				<p class="py-8 text-[#68746d]">Loading projects…</p>
			{:else}
				{#if projects.length === 0}
					<p class="py-8 text-[#68746d]">No projects match these filters.</p>
				{:else}
					<section
						class="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1"
						aria-label="Projects"
					>
						{#each projects as project (project.project_id)}
							<a
								class="relative grid gap-2.5 rounded-2xl border border-[#e1ddd4] bg-white p-5 text-inherit no-underline transition hover:-translate-y-0.5 hover:border-[#8bb699]"
								href={resolve(`/projects/${project.project_id}`)}
							>
								<div class="flex justify-between text-xs font-extrabold text-[#557762]">
									<span class="tag rounded-md bg-[#e8eee9] px-2 py-1 capitalize"
										>{project.project_status}</span
									>
								</div>
								<h2 class="m-0 mt-2 text-xl">{project.apartment_name}</h2>
								<p class="m-0 text-sm text-[#68746d] flex items-center gap-1.5">
									{project.developer_name} ·
									<span>
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
										{project.locality}</span
									>
								</p>
								<strong class="mt-1 text-[1.15rem]"
									>₹{project.price_min.toLocaleString('en-IN')} – ₹{project.price_max.toLocaleString(
										'en-IN'
									)}</strong
								>
								<p class="m-0 text-sm text-[#68746d]">
									{project.min_area_sqft.toLocaleString()}–{project.max_area_sqft.toLocaleString()} sq
									ft · {project.total_units} units
								</p>
							</a>
						{/each}
					</section>
					{#if hasMore}
						<button
							class="load-more mx-auto mt-8 block cursor-pointer rounded-[.55rem] border-0 bg-[#1e5b3a] px-4 py-3 font-inherit font-extrabold text-white"
							type="button"
							disabled={loadingMore}
							onclick={() => void fetchProjects()}
						>
							{loadingMore ? 'Loading…' : 'Load more'}
						</button>
					{/if}
				{/if}
			{/if}
		</section>
	</div>
</main>
