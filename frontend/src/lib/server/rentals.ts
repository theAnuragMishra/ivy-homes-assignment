export type Rental = {
	listing_id: string;
	listing_url: string;
	website: string;
	city_id: number;
	title: string;
	apartment_name: string;
	locality: string;
	property_type: string;
	bedroom: number;
	bathroom: number;
	floor: number;
	total_floors: number;
	furnishing: string;
	facing_direction: string;
	price: number;
	deposit: number;
	maintenance: number;
	carpet_area: number;
	super_builtup_area: number;
	latitude: number;
	longitude: number;
	posted_by: string;
	posted_by_name: string;
	posted_by_contact: string;
	description: string;
	posted_at: string;
	is_live: boolean;
};

export type RentalFilters = {
	locality?: string;
	bedroom?: number;
	propertyType?: string;
	furnishing?: string;
	minPrice?: number;
	maxPrice?: number;
	isLive?: boolean;
};

export function filterRentals(rentals: Rental[], filters: RentalFilters): Rental[] {
	return rentals.filter((item) => {
		if (filters.locality && item.locality.toLowerCase() !== filters.locality.toLowerCase()) {
			return false;
		}
		if (filters.bedroom !== undefined && item.bedroom !== filters.bedroom) return false;
		if (filters.propertyType && item.property_type !== filters.propertyType) return false;
		if (filters.furnishing && item.furnishing !== filters.furnishing) return false;
		if (filters.minPrice !== undefined && item.price < filters.minPrice) return false;
		if (filters.maxPrice !== undefined && item.price > filters.maxPrice) return false;
		if (filters.isLive !== undefined && item.is_live !== filters.isLive) return false;
		return true;
	});
}

export type SortKey = 'price' | 'carpet_area' | 'posted_at' | 'bedroom';

export function sortRentals(rentals: Rental[], sortBy?: string, order?: string): Rental[] {
	const key = (sortBy ?? 'posted_at') as SortKey;
	const direction = order === 'desc' ? -1 : 1;
	const validKeys: SortKey[] = ['price', 'carpet_area', 'posted_at', 'bedroom'];
	if (!validKeys.includes(key)) return rentals;

	return [...rentals].sort((a, b) => {
		const left = key === 'posted_at' ? Date.parse(a.posted_at) : a[key];
		const right = key === 'posted_at' ? Date.parse(b.posted_at) : b[key];
		if (left < right) return -1 * direction;
		if (left > right) return 1 * direction;
		return 0;
	});
}
