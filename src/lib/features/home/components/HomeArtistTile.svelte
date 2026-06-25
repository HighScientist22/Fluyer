<script lang="ts">
	import type { ArtistSummary } from '$lib/features/home/types';
	import Icon from '$lib/ui/icon/Icon.svelte';
	import { IconType } from '$lib/ui/icon/types';

	interface Props {
		artist: ArtistSummary;
		accent?: string;
		onplay?: () => void;
	}

	let { artist, accent = 'var(--home-accent, rgb(99, 102, 241))', onplay }: Props = $props();
	let isHovered = $state(false);
</script>

<button
	class="home-artist-tile group flex-shrink-0 text-center transition-transform duration-300"
	class:scale-[1.02]={isHovered}
	style="width: 120px"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
	onclick={onplay}
>
	<div class="relative mx-auto" style="width: 100px">
		<div
			class="mx-auto flex aspect-square w-[100px] items-center justify-center rounded-full text-2xl font-semibold"
			style="background: color-mix(in srgb, {accent} 30%, rgba(255,255,255,0.08))"
		>
			{artist.name.charAt(0).toUpperCase()}
		</div>
		{#if isHovered && onplay}
			<div
				class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"
			>
				<div class="h-8 w-8" style="color: {accent}">
					<Icon type={IconType.Play} />
				</div>
			</div>
		{/if}
	</div>
	<p class="mt-2 truncate text-sm font-medium">{artist.name}</p>
	<p class="text-opacity-background-60 text-xs">
		{artist.albumCount} albums · {artist.trackCount} tracks
	</p>
</button>
