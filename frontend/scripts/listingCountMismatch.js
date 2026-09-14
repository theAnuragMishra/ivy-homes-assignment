import fs from 'fs';

function loadListings() {
	const raw = fs.readFileSync('analysis/data/listings.json', 'utf8');
	return JSON.parse(raw);
}

function loadProjects() {
	const raw = fs.readFileSync('analysis/data/projects.json', 'utf8');
	return JSON.parse(raw);
}

function main() {
	const listings = loadListings();
	const projects = loadProjects();

	// Count actual listings per project_id
	const actualCounts = new Map();
	for (const l of listings) {
		if (!l.project_id || !l.is_live) continue;
		actualCounts.set(l.project_id, (actualCounts.get(l.project_id) || 0) + 1);
	}

	let highCount = 0;
	let lowCount = 0;
	//const mismatches = [];

	for (const p of projects) {
		const actual = actualCounts.get(p.project_id) || 0;
		const reported = p.total_listings;

		if (actual > reported) {
			highCount++;
		}
		if (actual < reported) {
			lowCount++;
		}
	}

	console.log(`Total projects: ${projects.length}`);
	console.log(`Projects with wrong total_listings: ${highCount}`);
	console.log(`Projects with wrong total_listings: ${lowCount}`);
	//console.log('Mismatches:', mismatches);
}

main();
