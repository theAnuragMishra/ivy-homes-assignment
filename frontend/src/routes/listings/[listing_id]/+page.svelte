<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { Listing } from '../../api/listings/+server';
	import { isSaved, loadSaved, toggleSaved } from '$lib/saved-store.svelte';

	let listing = $state<Listing | null>(null);
	let loading = $state(true);
	let error = $state('');

	let { data }: { data: { listing_id: string } } = $props();

	const formatPrice = (price: number) => {
		if (price >= 10_000_000) {
			return `₹${(price / 10_000_000).toFixed(2)} Cr`;
		}

		if (price >= 100_000) {
			return `₹${(price / 100_000).toFixed(2)} L`;
		}

		return `₹${price.toLocaleString('en-IN')}`;
	};

	const formatNumber = (value: number | null | undefined) =>
		value == null ? '—' : value.toLocaleString('en-IN');

	const formatDate = (value: string) =>
		new Date(value).toLocaleDateString('en-IN', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});

	onMount(async () => {
		void loadSaved();

		try {
			const response = await fetch(`/api/listings/${encodeURIComponent(data.listing_id)}`);
			const payload = await response.json();

			if (!response.ok) {
				error = payload.detail ?? 'Unable to load this listing.';
				return;
			}

			listing = payload as Listing;
		} catch {
			error = 'Unable to reach the application server.';
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>{listing ? `${listing.apartment_name} | Ivy Homes` : 'Listing | Ivy Homes'}</title>
</svelte:head>

<main class="shell">
	<a class="back" href={resolve('/listings')}>← Back to listings</a>

	{#if loading}
		<p class="message">Loading listing…</p>
	{:else if error}
		<p class="message error" role="alert">{error}</p>
	{:else if listing}
		<article>
			<!-- Header -->
			<header class="heading">
				<div class="heading-main">
					<div class="badges">
						{#if listing.is_verified}
							<span class="badge verified">✓ Verified</span>
						{/if}

						{#if listing.is_live}
							<span class="badge live">● Live</span>
						{/if}
					</div>

					<p class="eyebrow">
						{listing.bedroom} BHK · {listing.property_type}
					</p>

					<h1>{listing.apartment_name}</h1>

					<p class="location">
						<span>⌖</span>
						{listing.locality}
						{#if listing.facing_direction}
							<span class="separator">·</span>
							{listing.facing_direction}-facing
						{/if}
					</p>
				</div>

				<div class="price-block">
					<strong class="price">{formatPrice(listing.price)}</strong>

					<span class="price-exact">
						₹{listing.price.toLocaleString('en-IN')}
					</span>

					<button
						class="save-toggle"
						class:saved={isSaved(listing.listing_id)}
						type="button"
						onclick={() => void toggleSaved(listing!.listing_id)}
					>
						{isSaved(listing.listing_id) ? '★ Saved' : '☆ Save listing'}
					</button>
				</div>
			</header>

			<!-- Main property stats -->
			<section class="stats" aria-label="Property overview">
				<div class="stat">
					<span class="stat-icon">⌂</span>
					<div>
						<strong>{listing.bedroom}</strong>
						<span>Bedrooms</span>
					</div>
				</div>

				<div class="stat">
					<span class="stat-icon">♨</span>
					<div>
						<strong>{listing.bathroom}</strong>
						<span>Bathrooms</span>
					</div>
				</div>

				<div class="stat">
					<span class="stat-icon">▣</span>
					<div>
						<strong>{formatNumber(listing.carpet_area)}</strong>
						<span>sq ft carpet</span>
					</div>
				</div>

				<div class="stat">
					<span class="stat-icon">□</span>
					<div>
						<strong>{formatNumber(listing.super_built_up_area)}</strong>
						<span>sq ft built-up</span>
					</div>
				</div>

				<div class="stat">
					<span class="stat-icon">P</span>
					<div>
						<strong>{listing.covered_parking}</strong>
						<span>Covered parking</span>
					</div>
				</div>

				<div class="stat">
					<span class="stat-icon">↑</span>
					<div>
						<strong>{listing.floor} / {listing.total_floors}</strong>
						<span>Floor</span>
					</div>
				</div>
			</section>

			<!-- Content -->
			<div class="content">
				<div class="main-column">
					<section class="card description-card">
						<h2>About this property</h2>
						<p class="description">{listing.description}</p>
					</section>

					<section class="card">
						<h2>Property details</h2>

						<div class="details-grid">
							<div class="detail">
								<span>Property type</span>
								<strong>{listing.property_type}</strong>
							</div>

							<div class="detail">
								<span>Furnishing</span>
								<strong>{listing.furnishing}</strong>
							</div>

							<div class="detail">
								<span>Facing</span>
								<strong>{listing.facing_direction || '—'}</strong>
							</div>

							<div class="detail">
								<span>Balcony</span>
								<strong>{listing.balcony}</strong>
							</div>

							<div class="detail">
								<span>Bedrooms</span>
								<strong>{listing.bedroom}</strong>
							</div>

							<div class="detail">
								<span>Bathrooms</span>
								<strong>{listing.bathroom}</strong>
							</div>

							<div class="detail">
								<span>Carpet area</span>
								<strong>{formatNumber(listing.carpet_area)} sq ft</strong>
							</div>

							<div class="detail">
								<span>Super built-up area</span>
								<strong>{formatNumber(listing.super_built_up_area)} sq ft</strong>
							</div>

							<div class="detail">
								<span>Floor</span>
								<strong>{listing.floor} of {listing.total_floors}</strong>
							</div>

							<div class="detail">
								<span>Covered parking</span>
								<strong>{listing.covered_parking}</strong>
							</div>
						</div>
					</section>

					<!-- Location -->
					<section class="card">
						<div class="section-heading">
							<div>
								<h2>Location</h2>
								<p>{listing.locality}</p>
							</div>

							{#if listing.latitude && listing.longitude}
								<a
									class="map-link"
									href={`https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`}
									target="_blank"
									rel="noreferrer"
								>
									View on map ↗
								</a>
							{/if}
						</div>

						{#if listing.latitude && listing.longitude}
							<div class="coordinates">
								<span>Latitude</span>
								<strong>{listing.latitude}</strong>

								<span>Longitude</span>
								<strong>{listing.longitude}</strong>
							</div>
						{/if}
					</section>
				</div>

				<!-- Sidebar -->
				<aside class="sidebar">
					<section class="card contact-card">
						<div class="contact-label">LISTED BY</div>

						<h2>{listing.posted_by_name}</h2>

						<p class="agent-type">
							{listing.posted_by === 'agent' ? 'Property Agent' : listing.posted_by}
						</p>

						<a class="phone" href={`tel:${listing.posted_by_contact}`}>
							<span>☎</span>
							{listing.posted_by_contact}
						</a>

						<a class="contact-button" href={`tel:${listing.posted_by_contact}`}> Contact seller </a>
					</section>

					<section class="card">
						<h2>Listing information</h2>

						<div class="info-list">
							<div>
								<span>Listing ID</span>
								<strong>{listing.listing_id}</strong>
							</div>

							<div>
								<span>Posted</span>
								<strong>{formatDate(listing.posted_at)}</strong>
							</div>

							<div>
								<span>Status</span>
								<strong class:active={listing.is_live}>
									{listing.is_live ? 'Active' : 'Inactive'}
								</strong>
							</div>

							<div>
								<span>Verification</span>
								<strong class:verified-text={listing.is_verified}>
									{listing.is_verified ? 'Verified listing' : 'Not verified'}
								</strong>
							</div>

							<div>
								<span>Source</span>
								<strong>{listing.website}</strong>
							</div>
						</div>
					</section>

					{#if listing.listing_url}
						<a class="source-link" rel="external noreferrer" href={listing.listing_url} target="_blank">
							View original listing ↗
						</a>
					{/if}
				</aside>
			</div>
		</article>
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		background: #f5f3ee;
		color: #1e2924;
		font-family: Inter, system-ui, sans-serif;
	}

	.shell {
		width: min(72rem, calc(100% - 3rem));
		margin: 0 auto;
		padding: 2rem 0 5rem;
	}

	.back {
		color: #1e5b3a;
		font-weight: 700;
		text-decoration: none;
	}

	.back:hover {
		text-decoration: underline;
	}

	.heading {
		display: flex;
		justify-content: space-between;
		align-items: end;
		gap: 3rem;
		margin: 4rem 0 2rem;
	}

	.heading-main {
		min-width: 0;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.badge {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.65rem;
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 800;
	}

	.badge.verified {
		background: #e4f1e8;
		color: #21643d;
	}

	.badge.live {
		background: #edf5ed;
		color: #327144;
	}

	.eyebrow {
		margin: 0 0 0.7rem;
		color: #557762;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.16em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-size: clamp(2.5rem, 7vw, 5.5rem);
		line-height: 0.92;
		letter-spacing: -0.07em;
	}

	.location {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin: 1rem 0 0;
		color: #68746d;
		font-size: 1rem;
		text-transform: capitalize;
	}

	.separator {
		color: #b1b6b2;
	}

	.price-block {
		display: grid;
		gap: 0.15rem;
		justify-items: end;
		flex-shrink: 0;
	}

	.price {
		font-size: clamp(1.8rem, 4vw, 2.75rem);
		letter-spacing: -0.04em;
		white-space: nowrap;
	}

	.price-exact {
		color: #7a837e;
		font-size: 0.78rem;
	}

	.save-toggle {
		margin-top: 0.7rem;
		padding: 0.55rem 0.9rem;
		border: 1px solid #d8d5cc;
		border-radius: 0.55rem;
		background: #fff;
		color: #526058;
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
	}

	.save-toggle:hover {
		border-color: #aeb7b0;
	}

	.save-toggle.saved {
		border-color: #c99a2e;
		color: #8a6a1a;
		background: #fdf6e6;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 0;
		overflow: hidden;
		border: 1px solid #e1ddd4;
		border-radius: 1rem;
		background: #fff;
	}

	.stat {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 1.25rem 1rem;
		border-right: 1px solid #ebe8e1;
	}

	.stat:last-child {
		border-right: 0;
	}

	.stat-icon {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: #f0f4f0;
		color: #306746;
		font-weight: 800;
	}

	.stat div {
		display: grid;
		gap: 0.15rem;
	}

	.stat strong {
		font-size: 1rem;
	}

	.stat div span {
		color: #68746d;
		font-size: 0.72rem;
		white-space: nowrap;
	}

	.content {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) minmax(18rem, 0.8fr);
		gap: 1.5rem;
		margin-top: 1.5rem;
		align-items: start;
	}

	.main-column,
	.sidebar {
		display: grid;
		gap: 1.5rem;
	}

	.card {
		padding: 1.5rem;
		border: 1px solid #e1ddd4;
		border-radius: 1rem;
		background: #fff;
	}

	h2 {
		margin: 0 0 1rem;
		font-size: 1.2rem;
		letter-spacing: -0.02em;
	}

	.description {
		margin: 0;
		color: #526058;
		line-height: 1.75;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		border-top: 1px solid #ebe8e1;
	}

	.detail {
		display: grid;
		gap: 0.3rem;
		padding: 1rem 0;
		border-bottom: 1px solid #ebe8e1;
	}

	.detail:nth-child(odd) {
		margin-right: 1rem;
	}

	.detail span {
		color: #7a837e;
		font-size: 0.78rem;
	}

	.detail strong {
		font-size: 0.95rem;
		text-transform: capitalize;
	}

	.section-heading {
		display: flex;
		justify-content: space-between;
		align-items: start;
		gap: 1rem;
	}

	.section-heading h2 {
		margin-bottom: 0.25rem;
	}

	.section-heading p {
		margin: 0;
		color: #68746d;
		text-transform: capitalize;
	}

	.map-link {
		color: #1e5b3a;
		font-size: 0.8rem;
		font-weight: 800;
		text-decoration: none;
		white-space: nowrap;
	}

	.coordinates {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.5rem 1rem;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid #ebe8e1;
		font-size: 0.8rem;
	}

	.coordinates span {
		color: #7a837e;
	}

	.coordinates strong {
		font-weight: 600;
	}

	.contact-label {
		margin-bottom: 0.5rem;
		color: #7a837e;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.12em;
	}

	.contact-card h2 {
		margin-bottom: 0.2rem;
		font-size: 1.4rem;
	}

	.agent-type {
		margin: 0 0 1.25rem;
		color: #68746d;
		font-size: 0.85rem;
		text-transform: capitalize;
	}

	.phone {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: #1e2924;
		font-weight: 700;
		text-decoration: none;
	}

	.contact-button {
		display: block;
		margin-top: 1.25rem;
		padding: 0.8rem 1rem;
		border-radius: 0.55rem;
		background: #1e5b3a;
		color: #fff;
		text-align: center;
		font-size: 0.85rem;
		font-weight: 800;
		text-decoration: none;
	}

	.contact-button:hover {
		background: #17472d;
	}

	.info-list {
		display: grid;
		gap: 0;
	}

	.info-list > div {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.85rem 0;
		border-top: 1px solid #ebe8e1;
	}

	.info-list span {
		color: #7a837e;
		font-size: 0.78rem;
	}

	.info-list strong {
		font-size: 0.78rem;
		text-align: right;
		word-break: break-word;
	}

	.info-list strong.active,
	.info-list strong.verified-text {
		color: #2c7548;
	}

	.source-link {
		display: block;
		padding: 1rem;
		border: 1px solid #d8d5cc;
		border-radius: 0.7rem;
		color: #1e5b3a;
		background: #fff;
		font-size: 0.85rem;
		font-weight: 800;
		text-align: center;
		text-decoration: none;
	}

	.source-link:hover {
		background: #f8f7f3;
	}

	.message {
		padding: 3rem 0;
		color: #68746d;
	}

	.error {
		color: #a3362d;
	}

	@media (max-width: 900px) {
		.stats {
			grid-template-columns: repeat(3, 1fr);
		}

		.stat:nth-child(3) {
			border-right: 0;
		}

		.stat:nth-child(-n + 3) {
			border-bottom: 1px solid #ebe8e1;
		}

		.content {
			grid-template-columns: 1fr;
		}

		.sidebar {
			grid-template-columns: repeat(2, 1fr);
			align-items: start;
		}

		.source-link {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 650px) {
		.shell {
			width: min(100% - 2rem, 34rem);
		}

		.heading {
			display: block;
			margin-top: 3rem;
		}

		.price-block {
			justify-items: start;
			margin-top: 1.5rem;
		}

		.stats {
			grid-template-columns: repeat(2, 1fr);
		}

		.stat {
			border-right: 0;
			border-bottom: 1px solid #ebe8e1;
		}

		.stat:nth-last-child(-n + 2) {
			border-bottom: 0;
		}

		.sidebar {
			grid-template-columns: 1fr;
		}

		.source-link {
			grid-column: auto;
		}

		.details-grid {
			grid-template-columns: 1fr;
		}

		.detail:nth-child(odd) {
			margin-right: 0;
		}

		.section-heading {
			display: block;
		}

		.map-link {
			display: inline-block;
			margin-top: 0.75rem;
		}
	}
</style>
