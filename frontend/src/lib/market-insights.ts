export type Listing = {
	listing_id: string;
	website: string;
	apartment_name: string;
	locality: string;
	property_type: string;
	bedroom: number;
	price: number;
	carpet_area: number;
	super_built_up_area: number;
	is_live: boolean;
};

export type Rental = {
	listing_id: string;
	locality: string;
	price: number;
	is_live: boolean;
};

export type Project = {
	project_id: string;
	developer_name: string;
	locality: string;
	project_status: string;
	price_min: number;
	price_max: number;
	min_area_sqft: number;
	max_area_sqft: number;
};

const SQFT_PER_SQM = 10.7639;
function withCorrectedAreas(listings: Listing[]): Listing[] {
	const minByBedroom = new Map<string, number>();
	for (const item of listings) {
		if (item.website === 'magichomes') continue;
		const key = `${item.bedroom}:${item.property_type === 'plot'}`;
		const current = minByBedroom.get(key);
		if (current === undefined || item.carpet_area < current) minByBedroom.set(key, item.carpet_area);
	}
	return listings.map((item) => {
		if (item.website !== 'magichomes') return item;
		const floor = minByBedroom.get(`${item.bedroom}:${item.property_type === 'plot'}`);
		if (floor === undefined || item.carpet_area >= floor / 2) return item;
		return {
			...item,
			carpet_area: Math.round(item.carpet_area * SQFT_PER_SQM),
			super_built_up_area: Math.round(item.super_built_up_area * SQFT_PER_SQM)
		};
	});
}

function withCorrectedPrices(projects: Project[]): Project[] {
	return projects.map((project) => ({
		...project,
		price_min: project.price_min < 10 ? Math.round(project.price_min * 10_000_000) : Math.round(project.price_min * 100_000),
		price_max: project.price_max < 10 ? Math.round(project.price_max * 10_000_000) : Math.round(project.price_max * 100_000)
	}));
}

export type MarketInsight = {
	analytics: {
		total_listings: number;
		median_price: number;
		median_price_per_sqft: number;
		by_locality: Array<{ locality: string; count: number; median_price: number }>;
		by_bhk: Array<{ bedroom: number; count: number }>;
	};
	overview: {
		totalListings: number;
		activeListings: number;
		totalRentals: number;
		totalProjects: number;
		totalBuilders: number;
		totalLocalities: number;
	};
	prices: {
		sale: { min: number; max: number; average: number };
		rent: { min: number; max: number; average: number };
		project: { min: number; max: number; average: number };
	};
	localities: Array<{ name: string; listings: number; rentals: number; projects: number }>;
	bedrooms: Array<{ label: string; count: number }>;
	propertyTypes: Array<{ label: string; count: number }>;
	projectStatuses: Array<{ label: string; count: number }>;
	area: { min: number; max: number; average: number };
};

const average = (values: number[]) =>
	values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

function median(values: number[]): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
		: sorted[middle];
}

function distribution(values: string[], labelFor: (value: string) => string) {
	const counts = new Map<string, number>();
	for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
	return [...counts.entries()]
		.map(([label, count]) => ({ label: labelFor(label), count }))
		.sort((a, b) => b.count - a.count);
}

export function calculateMarketInsights(
	rawListings: Listing[],
	rawRentals: Rental[],
	rawProjects: Project[]
): MarketInsight {
	const listings = withCorrectedAreas(rawListings);
	const projects = withCorrectedPrices(rawProjects);
	const localityMap = new Map<string, { listings: number; rentals: number; projects: number }>();
	const locality = (value: string) => value.trim().toLowerCase();

	for (const item of listings) {
		const key = locality(item.locality);
		const current = localityMap.get(key) ?? { listings: 0, rentals: 0, projects: 0 };
		current.listings += 1;
		localityMap.set(key, current);
	}
	for (const item of rawRentals) {
		const key = locality(item.locality);
		const current = localityMap.get(key) ?? { listings: 0, rentals: 0, projects: 0 };
		current.rentals += 1;
		localityMap.set(key, current);
	}
	for (const item of projects) {
		const key = locality(item.locality);
		const current = localityMap.get(key) ?? { listings: 0, rentals: 0, projects: 0 };
		current.projects += 1;
		localityMap.set(key, current);
	}

	const salePrices = listings.filter((item) => item.price > 100000).map((item) => item.price);
	const analyticsListings = listings.filter((item) => item.price > 0 && item.carpet_area > 0);
	const rentPrices = rawRentals.filter((item) => item.price > 0).map((item) => item.price);
	const projectPrices = projects.filter((item) => item.price_max > 0).map((item) => item.price_max);
	const areaValues = listings
		.filter((item) => item.carpet_area > 0)
		.map((item) => item.carpet_area);
	const priceRange = (values: number[]) => ({
		min: Math.min(...values),
		max: Math.max(...values),
		average: average(values)
	});

	const localities = [...localityMap.entries()]
		.map(([name, counts]) => ({ name, ...counts }))
		.sort((a, b) => b.listings + b.rentals + b.projects - (a.listings + a.rentals + a.projects));
	const analyticsLocalities = new Map<string, Listing[]>();
	for (const item of listings) {
		const key = locality(item.locality);
		const group = analyticsLocalities.get(key) ?? [];
		group.push(item);
		analyticsLocalities.set(key, group);
	}
	const byLocality = [...analyticsLocalities.entries()]
		.map(([name, items]) => ({
			locality: name,
			count: items.length,
			median_price: median(items.map((item) => item.price))
		}))
		.sort((left, right) => right.count - left.count);
	const byBhk = distribution(
		listings.map((item) => String(item.bedroom)),
		(value) => value
	)
		.map((item) => ({ bedroom: Number(item.label), count: item.count }))
		.sort((left, right) => left.bedroom - right.bedroom);
	const pricePerSqft = analyticsListings.map((item) => item.price / item.carpet_area);

	return {
		analytics: {
			total_listings: listings.length,
			median_price: median(analyticsListings.map((item) => item.price)),
			median_price_per_sqft: Number(median(pricePerSqft).toFixed(2)),
			by_locality: byLocality,
			by_bhk: byBhk
		},
		overview: {
			totalListings: listings.length,
			activeListings: listings.filter((item) => item.is_live).length,
			totalRentals: rawRentals.length,
			totalProjects: projects.length,
			totalBuilders: new Set(projects.map((item) => item.developer_name.trim().toLowerCase())).size,
			totalLocalities: localityMap.size
		},
		prices: {
			sale: priceRange(salePrices),
			rent: priceRange(rentPrices),
			project: priceRange(projectPrices)
		},
		localities: localities.slice(0, 10),
		bedrooms: distribution(
			listings.map((item) => String(item.bedroom)),
			(value) => (value === '0' ? 'Plots / studio' : `${value} BHK`)
		),
		propertyTypes: distribution(
			listings.map((item) => item.property_type),
			(value) => value
		),
		projectStatuses: distribution(
			projects.map((item) => item.project_status),
			(value) => value
		),
		area: {
			min: Math.min(...areaValues),
			max: Math.max(...areaValues),
			average: average(areaValues)
		}
	};
}
