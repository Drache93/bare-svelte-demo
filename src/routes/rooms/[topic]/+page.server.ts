import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = ({ locals, params }) => {
	// Return an un-awaited promise — SvelteKit streams it to the client so the
	// page can render a loading state while the swarm is joining.
	const ready = locals.data.connect(params.topic).then(() => ({
		topicHex: locals.data.topicHex,
		messages: [...locals.data.log]
	}));

	return { ready };
};

export const actions: Actions = {
	send: async ({ locals, request }) => {
		const form = await request.formData();
		const text = (form.get('text') ?? '').toString().trim();
		if (!text) return fail(400, { text, missing: true });
		locals.data.send(text);
		return { ok: true };
	}
};
