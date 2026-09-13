import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => ({
	project_id: params.project_id
});
