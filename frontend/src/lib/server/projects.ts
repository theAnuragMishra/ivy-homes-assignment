export type Project = {
	project_id: string;
	project_url: string;
	city_id: number;
	apartment_name: string;
	developer_name: string;
	locality: string;
	project_status: string;
	total_units: number;
	total_towers: number;
	total_floors: number;
	launch_date: string;
	possession_date: string;
	rera_number: string;
	min_area_sqft: number;
	max_area_sqft: number;
	amenities: string[];
	latitude: number;
	longitude: number;
	total_listings: number;
	price_min: number;
	price_max: number;
};

const LAKH = 100_000;
const CRORE = 10_000_000;

function toRupees(rawValue: number): number {
	return rawValue < 10 ? Math.round(rawValue * CRORE) : Math.round(rawValue * LAKH);
}

export function withCorrectedPrices(projects: Project[]): Project[] {
	return projects.map((project) => ({
		...project,
		price_min: toRupees(project.price_min),
		price_max: toRupees(project.price_max)
	}));
}

export type ProjectFilters = {
	locality?: string;
	developer?: string;
	projectStatus?: string;
	minPrice?: number;
	maxPrice?: number;
	minArea?: number;
	maxArea?: number;
	minUnits?: number;
	maxUnits?: number;
	minTowers?: number;
	maxTowers?: number;
};

export function filterProjects(projects: Project[], filters: ProjectFilters): Project[] {
	return projects.filter((item) => {
		if (filters.locality && item.locality.toLowerCase() !== filters.locality.toLowerCase()) {
			return false;
		}
		if (filters.developer && item.developer_name.toLowerCase() !== filters.developer.toLowerCase()) {
			return false;
		}
		if (
			filters.projectStatus &&
			item.project_status.toLowerCase() !== filters.projectStatus.toLowerCase()
		) {
			return false;
		}
		if (filters.minPrice !== undefined && item.price_max < filters.minPrice) return false;
		if (filters.maxPrice !== undefined && item.price_min > filters.maxPrice) return false;
		if (filters.minArea !== undefined && item.max_area_sqft < filters.minArea) return false;
		if (filters.maxArea !== undefined && item.min_area_sqft > filters.maxArea) return false;
		if (filters.minUnits !== undefined && item.total_units < filters.minUnits) return false;
		if (filters.maxUnits !== undefined && item.total_units > filters.maxUnits) return false;
		if (filters.minTowers !== undefined && item.total_towers < filters.minTowers) return false;
		if (filters.maxTowers !== undefined && item.total_towers > filters.maxTowers) return false;
		return true;
	});
}

export type SortKey = 'price_min' | 'price_max' | 'launch_date' | 'total_units';

export function sortProjects(projects: Project[], sortBy?: string, order?: string): Project[] {
	const key = (sortBy ?? 'launch_date') as SortKey;
	const direction = order === 'desc' ? -1 : 1;
	const validKeys: SortKey[] = ['price_min', 'price_max', 'launch_date', 'total_units'];
	if (!validKeys.includes(key)) return projects;

	return [...projects].sort((a, b) => {
		const left = key === 'launch_date' ? Date.parse(a.launch_date) : a[key];
		const right = key === 'launch_date' ? Date.parse(b.launch_date) : b[key];
		if (left < right) return -1 * direction;
		if (left > right) return 1 * direction;
		return 0;
	});
}
