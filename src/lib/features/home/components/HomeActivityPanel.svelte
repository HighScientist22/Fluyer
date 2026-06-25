<script lang="ts">
	import type { RecentActivityTab, RecentAlbum } from '$lib/features/home/types';
	import StatsService from '$lib/services/StatsService.svelte';
	import HomeMediaTile from './HomeMediaTile.svelte';
	import View from '$lib/ui/components/View.svelte';

	interface Props {
		items: RecentAlbum[];
		tab: RecentActivityTab;
		accent?: string;
		ontabchange: (tab: RecentActivityTab) => void;
		onplay: (album: RecentAlbum) => void;
	}

	let { items, tab, accent = 'var(--home-accent, rgb(99, 102, 241))', ontabchange, onplay }: Props =
		$props();
</script>

<section>
	<View
		class="home-activity-panel overflow-hidden rounded-2xl p-5"
		glassEnableBlur
		style="--panel-accent: {accent}"
	>
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xs font-semibold uppercase tracking-widest text-white/90">Recent Activity</h2>
			<div class="flex gap-4">
				{#each ['played', 'added'] as t}
					<button
						class="relative pb-1 text-[10px] font-semibold uppercase tracking-wider transition-colors
						{tab === t ? 'text-white' : 'text-white/50 hover:text-white/75'}"
						onclick={() => ontabchange(t as RecentActivityTab)}
					>
						{t}
						{#if tab === t}
							<span
								class="absolute bottom-0 left-0 h-0.5 w-full rounded-full"
								style="background: {accent}"
							></span>
						{/if}
					</button>
				{/each}
			</div>
		</div>

		{#if items.length === 0}
			<p class="text-opacity-background-60 py-8 text-center text-sm">
				{tab === 'played'
					? 'Play something to see your listening history here.'
					: 'Add music folders to populate your library.'}
			</p>
		{:else}
			<div class="home-carousel -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
				{#each items as item}
					<HomeMediaTile
						title={item.album}
						subtitle={item.artist}
						path={item.path}
						badge={item.playedAt
							? StatsService.formatRelativeTime(item.playedAt)
							: item.badge}
						{accent}
						onplay={() => onplay(item)}
					/>
				{/each}
			</div>
		{/if}
	</View>
</section>

<style lang="scss">
	.home-activity-panel {
		background: color-mix(in srgb, var(--panel-accent, rgb(99, 102, 241)) 35%, transparent);
		border: 1px solid rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(24px);
	}
</style>
