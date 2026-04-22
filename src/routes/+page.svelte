<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{data.title}</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<div class="container mx-auto flex-col items-center justify-center">
	{#await data.values}
		<p>Loading...</p>
	{:then values}
		{#each values as v}
			<div class="w-full text-center">
				<p>{v}</p>
			</div>
		{/each}
	{/await}
</div>
