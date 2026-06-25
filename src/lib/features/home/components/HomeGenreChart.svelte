<script lang="ts">
	import type { GenreStat } from '$lib/features/home/types';
	import StatsService from '$lib/services/StatsService.svelte';
	import View from '$lib/ui/components/View.svelte';
	import HomeSectionHeader from './HomeSectionHeader.svelte';

	interface Props {
		stats: GenreStat[];
		accent?: string;
		libraryBased?: boolean;
	}

	let {
		stats,
		accent = 'var(--home-accent, rgb(99, 102, 241))',
		libraryBased = false
	}: Props = $props();

	const maxValue = $derived(Math.max(...stats.map((s) => s.playCount), 1));
</script>

{#if stats.length > 0}
	<section class="min-w-0">
		<HomeSectionHeader title={libraryBased ? 'Top Genres in Library' : 'Top Genres'}>
			{#snippet actions()}
				<span class="text-opacity-background-60 text-xs">
					{libraryBased ? 'Based on your collection' : 'Based on play history'}
				</span>
			{/snippet}
		</HomeSectionHeader>
		<View class="home-glass-panel rounded-[14px] p-5" glassEnableBlur>
			<div class="grid gap-3">
				{#each stats as stat, i}
					<div class="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-3">
						<span class="text-opacity-background-50 text-xs tabular-nums">{i + 1}</span>
						<div class="min-w-0">
							<div class="mb-1.5 flex items-center justify-between gap-2">
								<span class="truncate text-sm font-medium">{stat.genre}</span>
								<span class="text-opacity-background-60 shrink-0 text-xs">
									{libraryBased ? `${stat.playCount} tracks` : `${stat.playCount} plays`}
								</span>
							</div>
							<div class="h-2.5 overflow-hidden rounded-full bg-white/10">
								<div
									class="genre-bar h-full min-w-[4%] rounded-full transition-all duration-500"
									style="width: {Math.max((stat.playCount / maxValue) * 100, 4)}%; --bar-accent: {accent}"
								></div>
							</div>
						</div>
						{#if !libraryBased && stat.listenSeconds > 0}
							<span class="text-opacity-background-60 hidden text-xs whitespace-nowrap sm:block">
								{StatsService.formatListenTime(stat.listenSeconds)}
							</span>
						{:else}
							<span class="hidden sm:block"></span>
						{/if}
					</div>
				{/each}
			</div>
		</View>
	</section>
{/if}

<style lang="scss">
	.genre-bar {
		background: linear-gradient(
			90deg,
			color-mix(in srgb, var(--bar-accent) 95%, white),
			color-mix(in srgb, var(--bar-accent) 55%, transparent)
		);
	}
</style>
