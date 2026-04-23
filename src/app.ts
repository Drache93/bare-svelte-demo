import Hyperswarm from 'hyperswarm';
import ReadyResource from 'ready-resource';
import b4a from 'b4a';

export type Message = { name: string; text: string; at: number };

export class AppData extends ReadyResource {
	swarm: any = null;
	topic: Buffer | null = null;
	// In-memory history for this session. Peer `data` events + local sends
	// push into this list; SSE subscribers replay from an offset on connect.
	log: Message[] = [];

	// Single-flight guard: page load + SSE stream both call connect() for the
	// same topic, sometimes concurrently. Without this we'd race on
	// `swarm.join()` and end up announcing twice.
	private connecting: Promise<string | null> | null = null;

	async _open() {
		this.swarm = new Hyperswarm();

		this.swarm.on('connection', (peer: any) => {
			const name = b4a.toString(peer.remotePublicKey, 'hex').slice(0, 6);
			console.log(`[info] peer joined: ${name}`);
			this.emit('peers', this.peers);

			peer.on('data', (raw: Uint8Array) => {
				this.append({ name, text: b4a.toString(raw), at: Date.now() });
			});
			peer.on('close', () => {
				console.log(`[info] peer left: ${name}`);
				this.emit('peers', this.peers);
			});
			peer.on('error', (e: Error) => console.log(`peer error: ${e}`));
		});
	}

	get peers(): number {
		return this.swarm?.connections?.size ?? 0;
	}

	async _close() {
		if (this.swarm) await this.swarm.destroy();
	}

	get topicHex() {
		return this.topic ? b4a.toString(this.topic, 'hex') : null;
	}

	async connect(seed: string) {
		if (this.connecting) return this.connecting;
		this.connecting = (async () => {
			if (!this.opened) await this.ready();
			if (this.topic) return this.topicHex;
			this.topic = await normalize_topic(seed);
			const discovery = this.swarm.join(this.topic, { client: true, server: true });
			await discovery.flushed();
			return this.topicHex;
		})();
		return this.connecting;
	}

	send(text: string) {
		if (!text) return;
		const msg: Message = { name: 'me', text, at: Date.now() };
		this.append(msg);
		const payload = b4a.from(text);
		for (const peer of this.swarm.connections) peer.write(payload);
	}

	/** Append to log + notify SSE subscribers. */
	private append(msg: Message) {
		this.log.push(msg);
		this.emit('message', msg);
	}
}

/**
 * Hyperswarm topics must be exactly 32 bytes. Accept either:
 *   - a 64-char hex string (decoded directly — used by the "randomize" button), or
 *   - any other string (hashed with SHA-256 so passphrases still pair up deterministically).
 */
async function normalize_topic(seed: string): Promise<Buffer> {
	if (/^[0-9a-f]{64}$/i.test(seed)) return b4a.from(seed, 'hex');
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed));
	return b4a.from(new Uint8Array(digest));
}
