<script lang="ts">
	import MetadataService from '$lib/services/MetadataService.svelte';
	import TauriLibraryAPI from '$lib/tauri/TauriLibraryAPI';
	import StatsService from '$lib/services/StatsService.svelte';
	import favoritesStore from '$lib/stores/favorites.svelte';
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

	const isFavorite = $derived(favoritesStore.paths.has(path));

	async function toggleFavorite(e: MouseEvent) {
		e.stopPropagation();
		await StatsService.toggleFavorite(path);
	}

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
			<div class="absolute bottom-2 right-2 flex gap-2">
				<button
					class="rounded-full bg-black/55 p-2 transition-transform hover:scale-110"
					onclick={toggleFavorite}
				>
					<div class="h-3.5 w-3.5 {isFavorite ? 'text-rose-400' : ''}">
						<Icon type={IconType.Heart} />
					</div>
				</button>
				<button
					class="rounded-full p-2.5 shadow-lg transition-transform hover:scale-110"
					style="background: {accent}"
					onclick={onplay}
				>
					<div class="h-4 w-4 text-white">
						<Icon type={IconType.Play} />
					</div>
				</button>
			</div>
		{/if}
	</div>

	<button class="mt-2.5 w-full text-left" onclick={onopen}>
		<p class="truncate text-sm font-medium">{title}</p>
		<p class="text-opacity-background-75 truncate text-xs">{subtitle}</p>
	</button>
</div>
