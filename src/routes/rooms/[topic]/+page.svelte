<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { params, data }: PageProps = $props();

	type Message = { name: string; text: string; at: number };

	let messages = $state<Message[]>([]);
	let draft = $state('');
	let joined = $state(false);
	let peers = $state(0);

	// Wait for the swarm to join, seed the log, THEN open the live stream.
	$effect(() => {
		let es: EventSource | null = null;
		let cancelled = false;
		data.ready.then((resolved) => {
			if (cancelled) return;
			messages = untrack(() => [...resolved.messages]);
			joined = true;
			es = new EventSource(`/rooms/${params.topic}/stream?since=${resolved.messages.length}`);
			es.addEventListener('message', (ev) => {
				try {
					messages.push(JSON.parse(ev.data));
				} catch {}
			});
			es.addEventListener('peers', (ev) => {
				try {
					peers = JSON.parse(ev.data);
				} catch {}
			});
		});
		return () => {
			cancelled = true;
			es?.close();
		};
	});
</script>

<div class="scanlines flex min-h-screen flex-col bg-black text-pink-200">
	<div class="container mx-auto flex min-h-screen w-full max-w-2xl flex-col p-4">
		<header class="mb-4 flex items-start justify-between gap-4 border-b border-pink-500/40 pb-3">
			<div class="min-w-0 flex-1">
				<h1
					class="font-mono text-2xl font-bold tracking-widest text-pink-400 uppercase"
					style="text-shadow: 0 0 8px #ff00e5, 0 0 16px #ff00e5;"
				>
					// room
				</h1>
				<p class="font-mono text-xs break-all text-cyan-400/80">
					<span class="text-pink-500">topic$</span>
					{params.topic}: {#await data.ready then r}{r.topicHex}{/await}
				</p>
			</div>
			<div
				class="shrink-0 rounded border px-2 py-1 font-mono text-[10px] tracking-widest uppercase {joined
					? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(0,255,255,0.35)]'
					: 'border-pink-500/40 bg-pink-500/10 text-pink-300/70'}"
			>
				{#if joined}
					<span class="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-400 align-middle"
						style="box-shadow: 0 0 8px #00ffff;"
					></span>
					peers: {peers}
				{:else}
					<span class="animate-pulse">offline</span>
				{/if}
			</div>
		</header>

		{#if !joined}
			<div class="flex flex-1 flex-col items-center justify-center gap-3">
				<p class="animate-pulse font-mono text-cyan-400">&gt; joining swarm…</p>
				<p class="font-mono text-xs tracking-widest text-pink-500/60 uppercase">
					// awaiting discovery flush
				</p>
			</div>
		{:else}
			<div
				class="flex-1 space-y-1 overflow-y-auto rounded border border-cyan-500/40 bg-slate-950/60 p-3 shadow-[0_0_20px_rgba(0,255,255,0.15)_inset]"
			>
				{#each messages as m (m.at + m.name)}
					<div
						class="rounded border border-pink-500/20 bg-black/50 px-2 py-1 hover:border-pink-500/60"
					>
						<span class="font-mono text-xs text-pink-400">[{m.name}]</span>
						<span class="font-mono text-[10px] text-cyan-500/70">
							{new Date(m.at).toLocaleTimeString()}
						</span>
						<span class="font-mono text-sm text-pink-100">{m.text}</span>
					</div>
				{:else}
					<p class="font-mono text-cyan-500/60">&gt; awaiting transmission…</p>
				{/each}
			</div>

			<form
				method="POST"
				action="?/send"
				use:enhance={() => {
					const text = draft;
					draft = '';
					return async ({ result, update }) => {
						if (result.type === 'failure') draft = text;
						await update({ reset: false });
					};
				}}
				class="mt-3 flex gap-2"
			>
				<input
					name="text"
					type="text"
					placeholder="> type a message"
					bind:value={draft}
					class="flex-1 rounded border border-cyan-500/50 bg-black/80 px-3 py-2 font-mono text-pink-100 placeholder-cyan-500/40 outline-none focus:border-pink-500 focus:shadow-[0_0_12px_rgba(255,0,229,0.5)]"
				/>
				<button
					type="submit"
					class="rounded border border-pink-500 bg-pink-500/10 px-4 py-2 font-mono font-bold tracking-widest text-pink-300 uppercase transition hover:bg-pink-500/30 hover:text-pink-100 hover:shadow-[0_0_16px_rgba(255,0,229,0.7)]"
				>
					send
				</button>
			</form>
		{/if}
	</div>
</div>

<style>
	.scanlines {
		background-image:
			radial-gradient(ellipse at top, rgba(255, 0, 229, 0.08), transparent 60%),
			radial-gradient(ellipse at bottom, rgba(0, 255, 255, 0.06), transparent 60%),
			repeating-linear-gradient(
				0deg,
				rgba(255, 255, 255, 0.02) 0,
				rgba(255, 255, 255, 0.02) 1px,
				transparent 1px,
				transparent 3px
			);
	}
</style>
