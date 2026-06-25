<script lang="ts">
	import type { FocusMix } from '$lib/features/home/types';
	import MetadataService from '$lib/services/MetadataService.svelte';
	import TauriLibraryAPI from '$lib/tauri/TauriLibraryAPI';
	import Icon from '$lib/ui/icon/Icon.svelte';
	import { IconType } from '$lib/ui/icon/types';

	interface Props {
		mix: FocusMix;
		accent?: string;
		onplay: (shuffle: boolean) => void;
	}

	let { mix, accent = 'var(--home-accent, rgb(99, 102, 241))', onplay }: Props = $props();

	let coverArt = $state<string | null>(null);
	let isHovered = $state(false);

	$effect(() => {
		if (!mix.artworkPath) return;
		(async () => {
			const music = await TauriLibraryAPI.getMusicByPath(mix.artworkPath!);
			coverArt = await MetadataService.getMusicCoverArt(music ?? undefined, 130);
		})();
	});
</script>

<div
	class="home-focus-card flex-shrink-0 transition-transform duration-300"
	class:scale-[1.02]={isHovered}
	style="width: 130px"
	onmouseenter={() => (isHovered = true)}
	onmouseleave={() => (isHovered = false)}
>
	<div class="relative">
		<button class="block w-full overflow-hidden rounded-md" onclick={() => onplay(false)}>
			{#if coverArt}
				<img src={coverArt} alt={mix.title} class="aspect-square w-full object-cover" />
			{:else}
				<div class="aspect-square w-full bg-white/10"></div>
			{/if}
		</button>

		{#if isHovered}
			<div class="absolute bottom-2 right-2 flex gap-2">
				{#if mix.prefersShuffle}
					<button
						class="rounded-full bg-black/55 p-2 transition-transform hover:scale-110"
						onclick={() => onplay(true)}
					>
						<div class="h-3.5 w-3.5">
							<Icon type={IconType.Shuffle} />
						</div>
					</button>
				{/if}
				<button
					class="rounded-full p-2 transition-transform hover:scale-110"
					style="background: {accent}"
					onclick={() => onplay(false)}
				>
					<div class="h-3.5 w-3.5">
						<Icon type={IconType.Play} />
					</div>
				</button>
			</div>
		{/if}
	</div>

	<button class="mt-2.5 w-full text-left" onclick={() => onplay(false)}>
		<p class="truncate text-sm font-semibold">{mix.title}</p>
		<p class="text-opacity-background-70 truncate text-xs">{mix.subtitle}</p>
	</button>
</div>
