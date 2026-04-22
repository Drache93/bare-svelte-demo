import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import process from 'process';
import { AppData } from './app';

let appData: AppData | null = null;

if (!building && !appData) {
	appData = new AppData();

	const teardown = () => appData?.close();
	process.on('SIGINT', teardown);
	process.on('SIGTERM', teardown);
}

export const handle: Handle = async ({ event, resolve }) => {
	if (!appData!.opened) await appData!.ready();
	event.locals.data = appData as AppData;
	return resolve(event);
};
