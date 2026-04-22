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

	async _open() {
		this.swarm = new Hyperswarm();

		this.swarm.on('connection', (peer: any) => {
			const name = b4a.toString(peer.remotePublicKey, 'hex').slice(0, 6);
			console.log(`[info] peer joined: ${name}`);

			peer.on('data', (raw: Uint8Array) => {
				const text = b4a.toString(raw);
				this.append({ name, text, at: Date.now() });
			});
			peer.on('error', (e: Error) => console.log(`peer error: ${e}`));
		});

		this.swarm.on('update', () => {
			console.log(`[info] connections: ${this.swarm.connections.size}`);
			this.emit('peers', this.peers);
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
		if (this.topic) return this.topicHex;
		this.topic = b4a.from(seed);
		const discovery = this.swarm.join(this.topic, { client: true, server: true });
		await discovery.flushed();
		return this.topicHex;
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
