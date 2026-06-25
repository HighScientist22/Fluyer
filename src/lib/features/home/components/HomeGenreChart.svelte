<script lang="ts">
	import type { GenreStat } from '$lib/features/home/types';
	import StatsService from '$lib/services/StatsService.svelte';
	import View from '$lib/ui/components/View.svelte';

	interface Props {
		stats: GenreStat[];
		accent?: string;
	}

	let { stats, accent = 'var(--home-accent, rgb(99, 102, 241))' }: Props = $props();

	const maxPlays = $derived(Math.max(...stats.map((s) => s.playCount), 1));
</script>

{#if stats.length > 0}
	<section>
		<h2 class="home-section-title mb-4">Top Genres</h2>
		<View class="home-glass-panel rounded-xl p-4" glassEnableBlur>
			<div class="grid gap-3">
				{#each stats as stat}
					<div class="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
						<div>
							<div class="mb-1 flex items-center justify-between gap-2">
								<span class="truncate text-sm font-medium">{stat.genre}</span>
								<span class="text-opacity-background-60 text-xs">{stat.playCount} plays</span>
							</div>
							<div class="h-1.5 overflow-hidden rounded-full bg-white/10">
								<div
									class="h-full rounded-full transition-all duration-500"
									style="width: {(stat.playCount / maxPlays) * 100}%; background: {accent}"
								></div>
							</div>
						</div>
						<span class="text-opacity-background-60 text-xs whitespace-nowrap">
							{StatsService.formatListenTime(stat.listenSeconds)}
						</span>
					</div>
				{/each}
			</div>
		</View>
	</section>
{/if}
