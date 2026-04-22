import type { RequestHandler } from './$types';
import type { Message } from '../../../../app';

/**
 * Server-Sent Events stream. The client opens it with `new EventSource(...)`.
 * Emits two event types:
 *   - `message`: a chat message (peer or local)
 *   - `peers`:   current connected-peer count
 *
 *  GET /rooms/:topic/stream?since=<log-length>
 *    – `since` lets a reconnecting client skip what it already has.
 */
export const GET: RequestHandler = async ({ locals, params, request }) => {
	await locals.data.connect(params.topic);
	const app = locals.data;

	const encoder = new TextEncoder();
	const frame = (event: string, data: unknown) =>
		encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

	let onMessage: ((m: Message) => void) | null = null;
	let onPeers: ((n: number) => void) | null = null;

	const stream = new ReadableStream({
		start(controller) {
			// Resume: replay any log entries the client hasn't seen yet.
			const since = Number(new URL(request.url).searchParams.get('since') ?? '0');
			for (let i = Math.max(0, since); i < app.log.length; i++) {
				controller.enqueue(frame('message', app.log[i]));
			}

			// Initial peer count + subscribe to updates.
			controller.enqueue(frame('peers', app.peers));
			onPeers = (n) => controller.enqueue(frame('peers', n));
			app.on('peers', onPeers);

			onMessage = (m) => controller.enqueue(frame('message', m));
			app.on('message', onMessage);

			// Keep-alive comment so proxies / idle timeouts don't drop the stream.
			controller.enqueue(encoder.encode(': connected\n\n'));
		},
		cancel() {
			if (onMessage) app.off('message', onMessage);
			if (onPeers) app.off('peers', onPeers);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive'
		}
	});
};
