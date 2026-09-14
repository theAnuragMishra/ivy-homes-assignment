import fs from 'fs';
import { withCorrectedAreas } from '../src/lib/server/listings.ts';

// IDs to exclude, from your answers to Q4 and Q9
const corruptListingIds = [
	'100-4000397',
	'100-4000449',
	'100-4000457',
	'100-4000491',
	'100-4000738',
	'100-4001530',
	'100-4001703',
	'100-4002832',
	'100-4002961',
	'DWE-4000236',
	'DWE-4000412',
	'DWE-4000824',
	'DWE-4000891',
	'DWE-4001368',
	'DWE-4001424',
	'DWE-4001442',
	'DWE-4002045',
	'DWE-4002247',
	'DWE-4002374',
	'DWE-4002712',
	'DWE-4002806',
	'DWE-4003067',
	'MAG-4000145',
	'MAG-4000283',
	'MAG-4000883',
	'MAG-4001981',
	'MAG-4002491',
	'MAG-4002776',
	'MAG-4003100',
	'SQU-4000224',
	'SQU-4000308',
	'SQU-4000459',
	'SQU-4000583',
	'SQU-4001225',
	'SQU-4001601',
	'SQU-4002483',
	'ZER-4000021',
	'ZER-4000995',
	'ZER-4001161',
	'ZER-4001287',
	'ZER-4001669',
	'ZER-4001686',
	'ZER-4001726',
	'ZER-4001844',
	'ZER-4002352'
];

const fakeListingIds = [
	'100-4001484',
	'100-4001961',
	'DWE-4000745',
	'MAG-4000075',
	'MAG-4000870',
	'MAG-4001467',
	'MAG-4002092',
	'SQU-4001342',
	'ZER-4002683'
];

const excludedIds = new Set([...corruptListingIds, ...fakeListingIds]);

function loadListings() {
	const raw = fs.readFileSync('analysis/data/listings.json', 'utf8');
	return withCorrectedAreas(JSON.parse(raw));
}

function main() {
	const listings = loadListings();

	const filtered = listings.filter(
		(l) =>
			l.is_live === true &&
			l.bedroom === 2 &&
			!excludedIds.has(l.listing_id) &&
			typeof l.price === 'number' &&
			typeof l.carpet_area === 'number' &&
			l.carpet_area > 0
	);

	if (filtered.length === 0) {
		console.log('No matching records found.');
		return;
	}

	const ratios = filtered.map((l) => l.price / l.carpet_area);
	const mean = ratios.reduce((sum, r) => sum + r, 0) / ratios.length;

	console.log(`Matching records: ${filtered.length}`);
	console.log(`Mean price/carpet_area (Rs/sq ft): ${mean.toFixed(2)}`);
}

main();
