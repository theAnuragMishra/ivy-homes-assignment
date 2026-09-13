<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import MarketInsights from '$lib/MarketInsights.svelte';
	import heroImage from '../assets/Hero.jpg';

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
	<main class="mx-auto w-[min(72rem,calc(100%-3rem))] max-[520px]:w-[calc(100%-2rem)] py-12 max-[520px]:py-6">
		<section class="relative isolate min-h-[30rem] overflow-hidden rounded-[2rem] bg-[#1e2924] shadow-[0_1.5rem_4rem_#25352a20]" aria-labelledby="hero-title">
			<img class="absolute inset-0 -z-20 h-full w-full object-cover" src={heroImage} alt="A modern home surrounded by greenery" />
			<div class="absolute inset-0 -z-10 bg-gradient-to-r from-[#07150eeF] via-[#102219b3] to-[#10221933]"></div>
			<div class="absolute inset-0 -z-10 bg-gradient-to-b from-[#07150e66] via-transparent to-[#07150ed9]"></div>
			<div class="flex min-h-[30rem] flex-col justify-between p-8 text-white max-[700px]:min-h-[44rem] max-[560px]:p-6">
				<div class="max-w-2xl">
					<p class="mb-3 text-xs font-extrabold tracking-[.16em] text-[#d9ebdc]">RESEARCH-BACKED BROWSING</p>
					<h1 id="hero-title" class="m-0 text-[clamp(2.8rem,7vw,6rem)] leading-[.9] tracking-[-.07em]">
						Find a place that feels like home.
					</h1>
					<p class="mt-6 max-w-xl text-lg leading-relaxed text-[#f0f5ef]">
						Compare sale listings, rentals, and new projects across the city.
					</p>
				</div>
				<nav class="grid grid-cols-3 gap-4 max-[700px]:grid-cols-1" aria-label="Main sections">
					<a class="grid gap-1.5 rounded-2xl border border-[#8bb8e8]/50 bg-[#dbeafe]/95 p-4 text-[#102a43] no-underline shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-[#eff6ff]" href={resolve('/listings')}>
						<strong>Browse listings <span class="text-[#1d4ed8]">→</span></strong>
						<span class="text-xs leading-relaxed text-[#36536f]">Filter and compare sale properties.</span>
					</a>
					<a class="grid gap-1.5 rounded-2xl border border-[#8bb8e8]/50 bg-[#dbeafe]/95 p-4 text-[#102a43] no-underline shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-[#eff6ff]" href={resolve('/rentals')}>
						<strong>Explore rentals <span class="text-[#1d4ed8]">→</span></strong>
						<span class="text-xs leading-relaxed text-[#36536f]">See monthly rent and locality options.</span>
					</a>
					<a class="grid gap-1.5 rounded-2xl border border-[#8bb8e8]/50 bg-[#dbeafe]/95 p-4 text-[#102a43] no-underline shadow-lg backdrop-blur transition hover:-translate-y-1 hover:bg-[#eff6ff]" href={resolve('/projects')}>
						<strong>View projects <span class="text-[#1d4ed8]">→</span></strong>
						<span class="text-xs leading-relaxed text-[#36536f]">Browse developer projects and pricing.</span>
					</a>
				</nav>
			</div>
		</section>
		<MarketInsights />
	</main>
{/if}
