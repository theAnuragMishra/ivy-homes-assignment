<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import logo from '../assets/logo.svg';

	import '../app.css';

	let { children } = $props();

	async function signOut() {
		await fetch('/api/auth/logout', { method: 'POST' });
		await goto(resolve('/login'));
	}
</script>

<svelte:head>
	<link rel="icon" href={logo} />
</svelte:head>

{#if page.url.pathname !== '/login'}
	<nav class="border-b border-[#e1ddd4] bg-[#fbfaf7]" aria-label="Primary navigation">
		<div
			class="mx-auto flex min-h-16 w-[min(76rem,calc(100%-3rem))] items-center justify-between gap-6 max-[560px]:w-[calc(100%-2rem)]"
		>
			<a href={resolve('/')} aria-label="Ivy Homes home">
				<img class="h-6 w-auto" src={logo} alt="Ivy Homes" />
			</a>
			<div class="flex items-center gap-5 text-sm font-bold max-[700px]:gap-3 max-[560px]:text-xs">
				<a class="text-[#526058] no-underline hover:text-[#1e5b3a]" href={resolve('/listings')}>Listings</a>
				<a class="text-[#526058] no-underline hover:text-[#1e5b3a]" href={resolve('/rentals')}>Rentals</a>
				<a class="text-[#526058] no-underline hover:text-[#1e5b3a]" href={resolve('/projects')}>Projects</a>
				<a class="text-[#526058] no-underline hover:text-[#1e5b3a]" href={resolve('/saved')}>Saved</a>
				<button
					class="cursor-pointer rounded-[.55rem] border border-[#c9c6bd] bg-transparent px-3 py-2 font-inherit text-[#1e2924]"
					type="button"
					onclick={() => void signOut()}>Sign out</button
				>
			</div>
		</div>
	</nav>
{/if}

{@render children()}
