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
	<main class="loading">Loading your workspace…</main>
{:else if authenticated}
	<main class="shell">
		<header>
			<div>
				<p class="eyebrow">IVY HOMES</p>
				<h1>Your property workspace</h1>
			</div>
			<button
				onclick={async () => {
					await fetch('/api/auth/logout', { method: 'POST' });
					await goto(resolve('/login'));
				}}>Sign out</button
			>
		</header>
		<section class="hero">
			<p class="eyebrow">RESEARCH-BACKED BROWSING</p>
			<h2>Listings, rentals, and projects for your city.</h2>
			<p>
				The app will use the API behavior we verified instead of trusting stale documentation:
				actual pagination, saved listings, token refresh, and data-quality insights.
			</p>
		</section>
		<nav class="cards" aria-label="Main sections">
			<a href={resolve("/listings")}><strong>Browse listings</strong><span>Filter and compare sale properties.</span></a>
			<a href={resolve("/rentals")}><strong>Explore rentals</strong><span>See monthly rent and locality options.</span></a>
			<a href={resolve("/projects")}><strong>View projects</strong><span>Browse developer projects and pricing.</span></a>
			<a href={resolve("/insights")}><strong>Open insights</strong><span>Understand the data behind the listings.</span></a>
		</nav>
	</main>
{/if}

<style>
	:global(body) { margin: 0; background: #f5f3ee; color: #1e2924; font-family: Inter, system-ui, sans-serif; }
	.loading { min-height: 100vh; display: grid; place-items: center; color: #68746d; }
	.shell { width: min(72rem, calc(100% - 3rem)); margin: 0 auto; padding: 3rem 0; }
	header { display: flex; justify-content: space-between; align-items: start; gap: 2rem; }
	.eyebrow { margin: 0 0 .75rem; color: #557762; font-size: .75rem; font-weight: 800; letter-spacing: .16em; }
	h1, h2 { margin: 0; letter-spacing: -.05em; line-height: 1; }
	h1 { font-size: clamp(2.4rem, 7vw, 5rem); max-width: 38rem; }
	header button { padding: .7rem 1rem; border: 1px solid #c9c6bd; border-radius: .6rem; background: transparent; color: #1e2924; font: inherit; font-weight: 700; cursor: pointer; }
	.hero { max-width: 44rem; margin: 7rem 0 3rem; }
	h2 { font-size: clamp(2rem, 5vw, 4rem); }
	.hero p:last-child { max-width: 38rem; color: #68746d; line-height: 1.7; }
	.cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
	.cards a { display: grid; gap: .75rem; min-height: 8rem; padding: 1.25rem; border: 1px solid #e1ddd4; border-radius: 1rem; background: #fff; color: inherit; text-decoration: none; transition: transform .2s, border-color .2s; }
	.cards a:hover { transform: translateY(-3px); border-color: #8bb699; }
	.cards span { color: #68746d; font-size: .9rem; line-height: 1.5; }
	@media (max-width: 800px) { .cards { grid-template-columns: repeat(2, 1fr); } }
	@media (max-width: 520px) { .shell { width: min(100% - 2rem, 32rem); padding: 1.5rem 0; } header { align-items: center; } .hero { margin-top: 5rem; } .cards { grid-template-columns: 1fr; } }
</style>
