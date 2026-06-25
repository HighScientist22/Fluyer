<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		actions?: Snippet;
	}

	let { title, actions }: Props = $props();
</script>

<div class="mb-3 flex items-center justify-between gap-4">
	<h2 class="home-section-title">{title}</h2>
	{#if actions}
		<div class="flex shrink-0 items-center gap-3">
			{@render actions()}
		</div>
	{/if}
</div>

<style lang="scss">
	.home-section-title {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.35rem;
		font-weight: 400;
		letter-spacing: -0.01em;
		line-height: 1.2;
	}
</style>
