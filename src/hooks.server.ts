import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import Corestore from 'corestore';
import ReadyResource from 'ready-resource';
import process from 'bare-process';

class AppData extends ReadyResource {
	store: any = null;
	core: any = null;

	constructor() {
		super();
	}

	async _open() {
		this.store = new Corestore('./test');
		this.core = this.store.get({ name: 'local' });
	}

	async _close() {
		if (this.store) await this.store.close();
	}
}

let appData: AppData | null = null;

if (!building && !appData) {
	console.log('creating');
	appData = new AppData();

	process.on('SIGINT', () => appData?.close());
	process.on('SIGTERM', () => appData?.close());
}

export const handle: Handle = async ({ event, resolve }) => {
	if (!appData?.opened) await appData!.ready();

	event.locals.data = appData;
	const response = await resolve(event);
	return response;
};
