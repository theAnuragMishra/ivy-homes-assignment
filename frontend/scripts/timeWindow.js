import fs from 'fs';

/**
 * Loads the full set of listing records.
 * Replace this with however you actually access your data.
 */
function loadListings() {
	const raw = fs.readFileSync('analysis/data/listings.json', 'utf8');
	return JSON.parse(raw);
}

function main() {
	const listings = loadListings();

	// REFERENCE = 2026-09-10T00:00:00+05:30 (IST)
	const REFERENCE = new Date('2026-09-10T00:00:00+05:30');
	const WINDOW_START = new Date(REFERENCE.getTime() - 7 * 24 * 60 * 60 * 1000);

	const inWindow = listings.filter((l) => {
		if (!l.posted_at) return false;
		//console.log(l.posted_at);
		const p = l.posted_at + '+05:30'; // Append IST offset to the posted_at string
		const postedAt = new Date(p);
		if (isNaN(postedAt.getTime())) return false;
		return postedAt >= WINDOW_START && postedAt < REFERENCE;
	});

	console.log(
		`Window (IST): ${WINDOW_START.toISOString()} to ${REFERENCE.toISOString()} (UTC equivalents shown)`
	);
	console.log(`Count of listings posted in window: ${inWindow.length}`);
}

main();
