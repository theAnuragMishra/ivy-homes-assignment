import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
	listing_id: params.listing_id
});
