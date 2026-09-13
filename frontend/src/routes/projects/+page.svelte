<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Project, ProjectCollection } from '../api/projects/+server';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	let projects = $state<Project[]>([]);
	let loading = $state(true);
	let loadingMore = $state(false);
	let error = $state('');
	let hasMore = $state(false);
	let total = $state(0);
	let offset = $state(0);
	let locality = $state('');
	let developer = $state('');
	let projectStatus = $state('');
	let minPrice = $state('');
	let maxPrice = $state('');
	let minArea = $state('');
	let maxArea = $state('');
	let minUnits = $state('');
	let maxUnits = $state('');
	let minTowers = $state('');
	let maxTowers = $state('');
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
		if (minPrice) params.set('min_price', minPrice);
		if (maxPrice) params.set('max_price', maxPrice);
		if (minArea) params.set('min_area', minArea);
		if (maxArea) params.set('max_area', maxArea);
		if (minUnits) params.set('min_units', minUnits);
		if (maxUnits) params.set('max_units', maxUnits);
		if (minTowers) params.set('min_towers', minTowers);
		if (maxTowers) params.set('max_towers', maxTowers);
		return params;
	}

	async function fetchProjects(reset = false) {
		if (reset) {
			loading = true;
			error = '';
			offset = 0;
		} else {
			loadingMore = true;
		}

		try {
			const startOffset = reset ? 0 : offset;
			const response = await fetch(`/api/projects?${buildQuery(startOffset)}`);
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
			total = payload.total;
		} catch {
			error = 'Unable to reach the application server.';
		} finally {
			loading = false;
			loadingMore = false;
		}
	}

	function resetFilters() {
		locality = '';
		developer = '';
		projectStatus = '';
		minPrice = '';
		maxPrice = '';
		minArea = '';
		maxArea = '';
		minUnits = '';
		maxUnits = '';
		minTowers = '';
		maxTowers = '';
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
	<header class="mb-4 flex items-end gap-8">
		<div>
			<a class="mb-8 block text-sm font-bold text-[#1e5b3a] no-underline" href={resolve('/')}
				>← Workspace</a
			>
			<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">DEVELOPER PROJECTS</p>
			<h1 class="m-0 text-[clamp(2.3rem,6vw,4.5rem)] leading-[.95] tracking-[-.06em]">
				Browse upcoming projects.
			</h1>
		</div>
	</header>

	<p class="note mb-6 max-w-2xl text-sm leading-relaxed text-[#68746d]">
		Project prices are documented as plain rupees, but they're not — <code>price_min</code> and
		<code>price_max</code> are each independently reported in crores (when the raw value is under 10)
		or lakhs (when it's 10 or over). This app corrects both fields to real rupee values before filtering,
		sorting, or displaying anything, so the min/max budget filters below actually filter on real money.
	</p>

	<section
		class="filters grid grid-cols-4 items-end gap-3 rounded-2xl border border-[#e1ddd4] bg-white p-4 max-[900px]:grid-cols-3 max-[560px]:grid-cols-1"
		aria-label="Project filters"
	>
		<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
			Locality
			<input
				class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
				bind:value={locality}
				placeholder="e.g. perungudi"
				oninput={() => void fetchProjects(true)}
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
				oninput={() => void fetchProjects(true)}
			/>
		</label>
		<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
			Min budget
			<input
				class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
				bind:value={minPrice}
				type="number"
				min="0"
				placeholder="₹"
				oninput={() => void fetchProjects(true)}
			/>
		</label>
		<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
			Max budget
			<input
				class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
				bind:value={maxPrice}
				type="number"
				min="0"
				placeholder="₹"
				oninput={() => void fetchProjects(true)}
			/>
		</label>
		<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
			Min area
			<input
				class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
				bind:value={minArea}
				type="number"
				min="0"
				placeholder="sq ft"
				oninput={() => void fetchProjects(true)}
			/>
		</label>
		<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
			Max area
			<input
				class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
				bind:value={maxArea}
				type="number"
				min="0"
				placeholder="sq ft"
				oninput={() => void fetchProjects(true)}
			/>
		</label>
		<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
			Min units
			<input
				class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
				bind:value={minUnits}
				type="number"
				min="0"
				placeholder="units"
				oninput={() => void fetchProjects(true)}
			/>
		</label>
		<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
			Max units
			<input
				class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
				bind:value={maxUnits}
				type="number"
				min="0"
				placeholder="units"
				oninput={() => void fetchProjects(true)}
			/>
		</label>
		<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
			Min towers
			<input
				class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
				bind:value={minTowers}
				type="number"
				min="0"
				placeholder="towers"
				oninput={() => void fetchProjects(true)}
			/>
		</label>
		<label class="grid gap-1.5 text-xs font-bold text-[#526058]">
			Max towers
			<input
				class="box-border w-full rounded-[.55rem] border border-[#d8d5cc] bg-white p-2.5 font-inherit"
				bind:value={maxTowers}
				type="number"
				min="0"
				placeholder="towers"
				oninput={() => void fetchProjects(true)}
			/>
		</label>
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
	</section>

	{#if error}
		<p class="py-8 text-[#a3362d]" role="alert">{error}</p>
	{:else if loading}
		<p class="py-8 text-[#68746d]">Loading projects…</p>
	{:else}
		<div class="my-8 flex items-baseline gap-2 text-[#68746d]">
			<strong>{total.toLocaleString('en-IN')}</strong>
			<span>matching projects · {projects.length} loaded</span>
		</div>
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
						<p class="m-0 text-sm text-[#68746d]">{project.developer_name} · {project.locality}</p>
						<strong class="mt-1 text-[1.15rem]"
							>₹{project.price_min.toLocaleString('en-IN')} – ₹{project.price_max.toLocaleString(
								'en-IN'
							)}</strong
						>
						<p class="m-0 text-sm text-[#68746d]">
							{project.min_area_sqft.toLocaleString()}–{project.max_area_sqft.toLocaleString()} sq ft
							· {project.total_units} units
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
</main>
