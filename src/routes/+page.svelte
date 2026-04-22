<script lang="ts">
	import { goto } from '$app/navigation';

	let topic = $state('');

	function randomTopic() {
		const bytes = new Uint8Array(32);
		crypto.getRandomValues(bytes);
		topic = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
	}

	function join(e: Event) {
		e.preventDefault();
		const t = topic.trim();
		if (!t) return;
		goto(`/rooms/${t}`);
	}
</script>

<div class="scanlines flex min-h-screen flex-col items-center justify-center bg-black text-pink-200">
	<div class="w-full max-w-xl p-6">
		<header class="mb-8 text-center">
			<h1
				class="font-mono text-4xl font-bold tracking-[0.3em] text-pink-400 uppercase"
				style="text-shadow: 0 0 8px #ff00e5, 0 0 20px #ff00e5, 0 0 40px #ff00e5;"
			>
				bare//svelte
			</h1>
			<p class="mt-2 font-mono text-xs tracking-widest text-cyan-400/80 uppercase">
				&gt; peer-to-peer transmission console
			</p>
		</header>

		<form
			onsubmit={join}
			class="rounded border border-cyan-500/40 bg-slate-950/60 p-5 shadow-[0_0_30px_rgba(0,255,255,0.15)_inset]"
		>
			<label
				for="topic"
				class="mb-2 block font-mono text-xs tracking-widest text-cyan-400 uppercase"
			>
				&gt; enter room topic
			</label>
			<input
				id="topic"
				type="text"
				placeholder="topic hex or passphrase"
				bind:value={topic}
				class="w-full rounded border border-pink-500/40 bg-black/80 px-3 py-2 font-mono text-pink-100 placeholder-pink-500/40 outline-none focus:border-pink-500 focus:shadow-[0_0_12px_rgba(255,0,229,0.5)]"
			/>

			<div class="mt-4 flex gap-2">
				<button
					type="button"
					onclick={randomTopic}
					class="flex-1 rounded border border-cyan-500 bg-cyan-500/10 px-4 py-2 font-mono font-bold tracking-widest text-cyan-300 uppercase transition hover:bg-cyan-500/30 hover:text-cyan-100 hover:shadow-[0_0_16px_rgba(0,255,255,0.6)]"
				>
					randomize
				</button>
				<button
					type="submit"
					class="flex-1 rounded border border-pink-500 bg-pink-500/10 px-4 py-2 font-mono font-bold tracking-widest text-pink-300 uppercase transition hover:bg-pink-500/30 hover:text-pink-100 hover:shadow-[0_0_16px_rgba(255,0,229,0.7)]"
				>
					jack in
				</button>
			</div>
		</form>

		<p class="mt-6 text-center font-mono text-[10px] tracking-widest text-pink-500/50 uppercase">
			// share the topic with a peer to connect //
		</p>
	</div>
</div>

<style>
	.scanlines {
		background-image:
			radial-gradient(ellipse at top, rgba(255, 0, 229, 0.1), transparent 60%),
			radial-gradient(ellipse at bottom, rgba(0, 255, 255, 0.08), transparent 60%),
			repeating-linear-gradient(
				0deg,
				rgba(255, 255, 255, 0.02) 0,
				rgba(255, 255, 255, 0.02) 1px,
				transparent 1px,
				transparent 3px
			);
	}
</style>
