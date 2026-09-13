export type Listing = {
	listing_id: string;
	listing_url: string;
	website: string;
	city_id: number;
	apartment_name: string;
	locality: string;
	property_type: string;
	bedroom: number;
	bathroom: number;
	balcony: number;
	floor: number;
	total_floors: number;
	furnishing: string;
	facing_direction: string;
	covered_parking: number;
	price: number;
	carpet_area: number;
	super_built_up_area: number;
	latitude: number;
	longitude: number;
	posted_by: string;
	posted_by_name: string;
	posted_by_contact: string;
	project_id: string | null;
	is_verified: boolean;
	description: string;
	posted_at: string;
	is_live: boolean;
};

const SQFT_PER_SQM = 10.7639;

/**
 * ~337 of 842 `magichomes` listings report carpet_area/super_built_up_area
 * in square metres instead of square feet (documented as "square feet,
 * integer, everywhere" -- see submission.json findings, category "units").
 * Every other source website is consistently in square feet for every
 * bedroom count; magichomes-affected records are 5-10x smaller than the
 * smallest legitimate square-foot value for the same bedroom count, with a
 * large, clean gap and nothing in between. This computes that per-bedroom
 * floor once from the non-magichomes population and returns a corrected
 * copy of every listing with areas normalized to square feet.
 */
export function withCorrectedAreas(listings: Listing[]): Listing[] {
	const minByBedroom = new Map<string, number>();
	for (const item of listings) {
		if (item.website === 'magichomes') continue;
		const key = `${item.bedroom}:${item.property_type === 'plot'}`;
		const current = minByBedroom.get(key);
		if (current === undefined || item.carpet_area < current) {
			minByBedroom.set(key, item.carpet_area);
		}
	}

	return listings.map((item) => {
		if (item.website !== 'magichomes') return item;
		const key = `${item.bedroom}:${item.property_type === 'plot'}`;
		const floor = minByBedroom.get(key);
		if (floor === undefined || item.carpet_area >= floor / 2) return item;
		return {
			...item,
			carpet_area: Math.round(item.carpet_area * SQFT_PER_SQM),
			super_built_up_area: Math.round(item.super_built_up_area * SQFT_PER_SQM)
		};
	});
}

export type ListingFilters = {
	locality?: string;
	bedroom?: number;
	propertyType?: string;
	furnishing?: string;
	minPrice?: number;
	maxPrice?: number;
	isLive?: boolean;
	projectId?: string;
};

export function filterListings(listings: Listing[], filters: ListingFilters): Listing[] {
	return listings.filter((item) => {
		if (item.price && item.price <= 0) {
			return false;
		}
		if (item.bedroom == 0 && item.property_type != 'plot') {
			return false;
		}
		if (item.floor && item.total_floors && item.floor > item.total_floors) {
			return false;
		}
		if (
			item.carpet_area &&
			item.super_built_up_area &&
			item.carpet_area > item.super_built_up_area
		) {
			return false;
		}
		if (filters.locality && item.locality.toLowerCase() !== filters.locality.toLowerCase()) {
			return false;
		}
		if (filters.bedroom !== undefined && item.bedroom !== filters.bedroom) return false;
		if (filters.propertyType && item.property_type !== filters.propertyType) return false;
		if (filters.furnishing && item.furnishing !== filters.furnishing) return false;
		if (filters.minPrice !== undefined && item.price < filters.minPrice) return false;
		if (filters.maxPrice !== undefined && item.price > filters.maxPrice) return false;
		if (filters.isLive !== undefined && item.is_live !== filters.isLive) return false;
		if (filters.projectId && item.project_id !== filters.projectId) return false;
		return true;
	});
}

export type SortKey = 'price' | 'carpet_area' | 'posted_at' | 'bedroom';

export function sortListings(listings: Listing[], sortBy?: string, order?: string): Listing[] {
	const key = (sortBy ?? 'posted_at') as SortKey;
	const direction = order === 'desc' ? -1 : 1;
	const validKeys: SortKey[] = ['price', 'carpet_area', 'posted_at', 'bedroom'];
	if (!validKeys.includes(key)) return listings;

	return [...listings].sort((a, b) => {
		const left = key === 'posted_at' ? Date.parse(a.posted_at) : a[key];
		const right = key === 'posted_at' ? Date.parse(b.posted_at) : b[key];
		if (left < right) return -1 * direction;
		if (left > right) return 1 * direction;
		return 0;
	});
}
