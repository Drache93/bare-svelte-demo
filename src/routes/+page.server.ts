import type { PageServerLoad } from './$types';
import b4a from 'b4a';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		title: 'Hello world',
		values: getValues(locals.data.core)
	};
};

async function getValues(core: any) {
	await core.append(b4a.from(new Date().toString()));

	const values = [];
	for await (const v of core.createReadStream()) {
		values.push(v.toString());
	}
	return values;
}
