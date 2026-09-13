<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import logo from '../../assets/logo.svg';
	

	let email = $state('demo1@ivy.homes');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	const targetPage = page.url.searchParams.get('redirect') ?? '/';

	async function login() {
		error = '';
		loading = true;
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});
			const payload = await response.json();
			if (!response.ok) {
				error = payload.detail ?? 'Login failed.';
				return;
			}
			await goto(targetPage);
		} catch {
			error = 'Unable to reach the application server.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign in | Ivy Homes</title>
	<meta
		name="description"
		content="Sign in to browse Ivy Homes listings, rentals, projects, and saved properties."
	/>
</svelte:head>

<main class="grid min-h-screen place-items-center p-8">
	<section
		class="w-full max-w-md rounded-[1.25rem] border border-[#e5e0d7] bg-white p-10 shadow-[0_1rem_3rem_#25352a12]"
	>
		<img class="mb-5 h-6 w-auto" src={logo} alt="Ivy Homes" />
		<h1 class="m-0 text-[clamp(2rem,6vw,3.25rem)] leading-[.98] tracking-[-.06em]">
			Find a place that fits.
		</h1>
		<p class="leading-relaxed text-[#68746d]">
			Sign in with one of the demo accounts provided for your assignment.
		</p>

		<form
			class="mt-8 grid gap-4"
			onsubmit={(event) => {
				event.preventDefault();
				login();
			}}
		>
			<label class="grid gap-1.5 text-sm font-bold text-[#526058]">
				Email
				<input
					class="box-border w-full rounded-[.65rem] border border-[#d8d5cc] p-3.5 font-inherit focus:outline-2 focus:outline-[#8bb699] focus:outline-offset-2"
					bind:value={email}
					type="email"
					autocomplete="email"
					required
				/>
			</label>
			<label class="grid gap-1.5 text-sm font-bold text-[#526058]">
				Password
				<input
					class="box-border w-full rounded-[.65rem] border border-[#d8d5cc] p-3.5 font-inherit focus:outline-2 focus:outline-[#8bb699] focus:outline-offset-2"
					bind:value={password}
					type="password"
					autocomplete="current-password"
					required
				/>
			</label>
			{#if error}
				<p class="m-0 text-sm text-[#a3362d]" role="alert">{error}</p>
			{/if}
			<button
				class="mt-2 cursor-pointer rounded-[.65rem] border-0 bg-[#1e5b3a] px-4 py-3.5 font-extrabold text-white disabled:cursor-wait disabled:opacity-65"
				disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button
			>
		</form>
	</section>
</main>
