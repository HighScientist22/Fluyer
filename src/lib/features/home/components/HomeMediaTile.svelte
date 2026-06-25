<script lang="ts">
	import MetadataService from '$lib/services/MetadataService.svelte';
	import TauriLibraryAPI from '$lib/tauri/TauriLibraryAPI';
	import StatsService from '$lib/services/StatsService.svelte';
	import Icon from '$lib/ui/icon/Icon.svelte';
	import { IconType } from '$lib/ui/icon/types';

	interface Props {
		title: string;
		subtitle: string;
		path: string;
		badge?: string;
		accent?: string;
		onopen?: () => void;
		onplay?: () => void;
	}

	let {
		title,
		subtitle,
		path,
		badge,
		accent = 'var(--home-accent, rgb(99, 102, 241))',
		onopen,
		onplay
	}: Props = $props();

	let coverArt = $state<string | null>(null);
	let isHovered = $state(false);

	$effect(() => {
		(async () => {
			const music = await TauriLibraryAPI.getMusicByPath(path);
			coverArt = await MetadataService.getMusicCoverArt(music ?? undefined, 136);
		})();
	});
</script>

<div
	class="home-media-tile group flex-shrink-0 transition-transform duration-300"
	class:scale-[1.02]={isHovered}
	style="width: 136px"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	<div class="relative">
		<button class="block w-full overflow-hidden rounded-md" onclick={onopen}>
			{#if coverArt}
				<img src={coverArt} alt={title} class="aspect-square w-full object-cover" />
			{:else}
				<div class="aspect-square w-full bg-white/10"></div>
			{/if}
			{#if badge}
				<span
					class="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium"
				>
					{badge}
				</span>
			{/if}
		</button>

		{#if isHovered && onplay}
			<button
				class="absolute bottom-2 right-2 rounded-full p-2.5 shadow-lg transition-transform hover:scale-110"
				style="background: {accent}"
				onclick={onplay}
			>
				<div class="h-4 w-4 text-white">
					<Icon type={IconType.Play} />
				</div>
			</button>
		{/if}
	</div>

	<button class="mt-2.5 w-full text-left" onclick={onopen}>
		<p class="truncate text-sm font-medium">{title}</p>
		<p class="text-opacity-background-75 truncate text-xs">{subtitle}</p>
	</button>
</div>
