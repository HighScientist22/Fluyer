<script lang="ts">
	import type { RecentActivityTab, RecentAlbum } from '$lib/features/home/types';
	import StatsService from '$lib/services/StatsService.svelte';
	import HomeMediaTile from './HomeMediaTile.svelte';

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

<section class="liquid-glass-accent-panel min-w-0">
	<div class="flex items-center justify-between gap-4 px-5 pb-4 pt-[18px]">
		<h2 class="text-xs font-semibold uppercase tracking-[0.08em] text-white/70">Recent Activity</h2>
		<div class="flex gap-1">
			{#each ['played', 'added'] as t}
				<button
					class="relative px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors
					{tab === t ? 'text-white' : 'text-white/50 hover:text-white/80'}"
					onclick={() => ontabchange(t as RecentActivityTab)}
				>
					{t === 'played' ? 'Played' : 'Added'}
					{#if tab === t}
						<span class="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-white"></span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	{#if items.length === 0}
		<p class="text-opacity-background-60 px-5 pb-5 text-center text-sm">
			{tab === 'played'
				? 'Nothing played yet'
				: 'No recent additions'}
		</p>
	{:else}
		<div class="home-carousel flex h-[228px] gap-6 overflow-x-auto px-5 pb-5">
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
</section>

<style lang="scss">
	.home-carousel {
		scrollbar-width: none;
		&::-webkit-scrollbar {
			display: none;
		}
	}
</style>
