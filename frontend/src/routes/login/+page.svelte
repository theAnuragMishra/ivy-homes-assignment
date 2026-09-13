<script lang="ts">
	import { goto } from '$app/navigation';

	let email = $state('demo1@ivy.homes');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

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
			await goto('/');
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

<main class="auth-shell">
	<section class="auth-card">
		<p class="eyebrow">IVY HOMES</p>
		<h1>Find a place that fits.</h1>
		<p class="muted">Sign in with one of the demo accounts provided for your assignment.</p>

		<form onsubmit={(event) => { event.preventDefault(); login(); }}>
			<label>
				Email
				<input bind:value={email} type="email" autocomplete="email" required />
			</label>
			<label>
				Password
				<input bind:value={password} type="password" autocomplete="current-password" required />
			</label>
			{#if error}
				<p class="error" role="alert">{error}</p>
			{/if}
			<button disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
		</form>
	</section>
</main>

<style>
	:global(body) { margin: 0; background: #f5f3ee; color: #1e2924; font-family: Inter, system-ui, sans-serif; }
	.auth-shell { min-height: 100vh; display: grid; place-items: center; padding: 2rem; }
	.auth-card { width: min(100%, 27rem); padding: 2.5rem; background: white; border: 1px solid #e5e0d7; border-radius: 1.25rem; box-shadow: 0 1rem 3rem #25352a12; }
	.eyebrow { margin: 0 0 1.25rem; color: #557762; font-size: .75rem; font-weight: 800; letter-spacing: .16em; }
	h1 { margin: 0; font-size: clamp(2rem, 6vw, 3.25rem); line-height: .98; letter-spacing: -.06em; }
	.muted { color: #68746d; line-height: 1.6; }
	form { display: grid; gap: 1rem; margin-top: 2rem; }
	label { display: grid; gap: .4rem; color: #526058; font-size: .85rem; font-weight: 700; }
	input { box-sizing: border-box; width: 100%; padding: .8rem .9rem; border: 1px solid #d8d5cc; border-radius: .65rem; font: inherit; }
	input:focus { outline: 2px solid #8bb699; outline-offset: 2px; }
	button { margin-top: .5rem; padding: .85rem 1rem; border: 0; border-radius: .65rem; background: #1e5b3a; color: white; font: inherit; font-weight: 800; cursor: pointer; }
	button:disabled { cursor: wait; opacity: .65; }
	.error { margin: 0; color: #a3362d; font-size: .9rem; }
</style>
