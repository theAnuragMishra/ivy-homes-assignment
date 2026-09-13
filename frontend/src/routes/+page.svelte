<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let authenticated = $state(false);
	let loading = $state(true);

	onMount(() => {
		const refreshSession = async () => {
			const response = await fetch('/api/auth/refresh', { method: 'POST' });
			if (response.status === 401) {
				await goto(resolve('/login'));
			}
		};
		const refreshTimer = window.setInterval(refreshSession, 10 * 60 * 1000);
		const initialize = async () => {
			const response = await fetch('/api/session');
			const payload = await response.json();
			authenticated = payload.authenticated;
			loading = false;
			if (!authenticated) {
				await goto(resolve('/login'));
			}
		};
		void initialize();

		return () => window.clearInterval(refreshTimer);
	});
</script>

<svelte:head>
	<title>Ivy Homes</title>
</svelte:head>

{#if loading}
	<main class="grid min-h-screen place-items-center text-[#68746d]">Loading your workspace…</main>
{:else if authenticated}
	<main class="mx-auto w-[min(72rem,calc(100%-3rem))] py-12 max-[520px]:w-[calc(100%-2rem)] max-[520px]:py-6">
		<header class="flex items-start justify-between gap-8 max-[520px]:items-center">
			<div>
				<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">IVY HOMES</p>
				<h1 class="m-0 max-w-[38rem] text-[clamp(2.4rem,7vw,5rem)] leading-none tracking-[-.05em]">Your property workspace</h1>
			</div>
			<button
				class="cursor-pointer rounded-[.6rem] border border-[#c9c6bd] bg-transparent px-4 py-3 font-bold text-[#1e2924]"
				onclick={async () => {
					await fetch('/api/auth/logout', { method: 'POST' });
					await goto(resolve('/login'));
				}}>Sign out</button
			>
		</header>
		<section class="my-28 mb-12 max-w-2xl max-[520px]:mt-20">
			<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#557762]">RESEARCH-BACKED BROWSING</p>
			<h2 class="m-0 text-[clamp(2rem,5vw,4rem)] leading-none tracking-[-.05em]">Listings, rentals, and projects for your city.</h2>
			<p class="max-w-xl leading-relaxed text-[#68746d]">
				The app will use the API behavior we verified instead of trusting stale documentation:
				actual pagination, saved listings, token refresh, and data-quality insights.
			</p>
		</section>
		<nav class="grid grid-cols-4 gap-4 max-[800px]:grid-cols-2 max-[520px]:grid-cols-1" aria-label="Main sections">
			<a class="grid min-h-32 gap-3 rounded-2xl border border-[#e1ddd4] bg-white p-5 text-inherit no-underline transition hover:-translate-y-0.5 hover:border-[#8bb699]" href={resolve("/listings")}><strong>Browse listings</strong><span class="text-sm leading-relaxed text-[#68746d]">Filter and compare sale properties.</span></a>
			<a class="grid min-h-32 gap-3 rounded-2xl border border-[#e1ddd4] bg-white p-5 text-inherit no-underline transition hover:-translate-y-0.5 hover:border-[#8bb699]" href="/rentals"><strong>Explore rentals</strong><span class="text-sm leading-relaxed text-[#68746d]">See monthly rent and locality options.</span></a>
			<a class="grid min-h-32 gap-3 rounded-2xl border border-[#e1ddd4] bg-white p-5 text-inherit no-underline transition hover:-translate-y-0.5 hover:border-[#8bb699]" href="/projects"><strong>View projects</strong><span class="text-sm leading-relaxed text-[#68746d]">Browse developer projects and pricing.</span></a>
			<a class="grid min-h-32 gap-3 rounded-2xl border border-[#e1ddd4] bg-white p-5 text-inherit no-underline transition hover:-translate-y-0.5 hover:border-[#8bb699]" href="/insights"><strong>Open insights</strong><span class="text-sm leading-relaxed text-[#68746d]">Understand the data behind the listings.</span></a>
		</nav>
	</main>
{/if}
