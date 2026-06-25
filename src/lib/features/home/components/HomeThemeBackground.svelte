<script lang="ts">
	interface Props {
		artworkUrl?: string | null;
	}

	let { artworkUrl = null }: Props = $props();
</script>

<div class="home-theme-bg" aria-hidden="true">
	<div class="home-theme-bg__gradient"></div>
	{#if artworkUrl}
		<div class="home-theme-bg__art" style="background-image: url('{artworkUrl}')"></div>
	{/if}
</div>
