<script lang="ts">
	import { onMount } from 'svelte';
	import musicStore from '$lib/stores/music.svelte';
	import StatsService from '$lib/services/StatsService.svelte';
	import { IconType } from '$lib/ui/icon/types';
	import { useHomeDashboard } from '../viewmodels/useHomeDashboard.svelte';
	import HomeStatCard from './HomeStatCard.svelte';
	import HomeActivityPanel from './HomeActivityPanel.svelte';
	import HomeGenreChart from './HomeGenreChart.svelte';
	import HomeFocusCard from './HomeFocusCard.svelte';
	import HomeMediaTile from './HomeMediaTile.svelte';
	import HomeArtistTile from './HomeArtistTile.svelte';
	import HomeSectionHeader from './HomeSectionHeader.svelte';
	import HomeThemeBackground from './HomeThemeBackground.svelte';
	import TauriLibraryAPI, { CollectionType } from '$lib/tauri/TauriLibraryAPI';
	import filterStore from '$lib/stores/filter.svelte';
	import { MusicListType, type AlbumData } from '$lib/features/music/types';
	import MetadataService from '$lib/services/MetadataService.svelte';
	import ProgressService from '$lib/services/ProgressService.svelte';

	const vm = useHomeDashboard();

	onMount(() => {
		vm.setGreeting();
		vm.load();
	});

	async function openAlbum(path: string) {
		const music = await TauriLibraryAPI.getMusicByPath(path);
		if (!music?.album) return;

		for (let i = 0; i < musicStore.albumCount; i++) {
			const first = await TauriLibraryAPI.getAlbumFirstByIndex(i, '', true);
			if (first?.album === music.album) {
				const tracks = await TauriLibraryAPI.getAlbumByIndex(i, '', true);
				musicStore.listType = MusicListType.All;
				filterStore.album = {
					name: music.album,
					artist: music.albumArtist ?? music.artist ?? '',
					year: MetadataService.getYearFromDate(music.date),
					duration: ProgressService.formatDuration(
						(tracks ?? []).reduce((sum, t) => sum + t.duration, 0)
					),
					tracks: tracks ?? []
				} as AlbumData;
				return;
			}
		}
	}

	const albumCarousel = $derived(
		Array.from({ length: Math.min(musicStore.albumCount, 12) }, (_, i) => i)
	);

	let heroArtwork = $state<string | null>(null);

	$effect(() => {
		const path = vm.recentPlayed[0]?.path ?? vm.recentlyAdded[0]?.path;
		if (!path) {
			heroArtwork = null;
			return;
		}
		(async () => {
			const music = await TauriLibraryAPI.getMusicByPath(path);
			heroArtwork = await MetadataService.getMusicCoverArt(music ?? undefined, 512);
		})();
	});
</script>

<HomeThemeBackground artworkUrl={heroArtwork} />

<div class="home-dashboard scrollbar-hidden relative h-full w-full min-w-0 overflow-y-auto pb-32">
	<div class="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8">
		<header class="mb-6 flex items-start justify-between gap-4">
			<div class="min-w-0">
				<h1 class="home-greeting">{vm.greeting}</h1>
				<p class="text-opacity-background-70 mt-2 text-sm">
					Your local library — private, offline, and yours.
				</p>
			</div>
			<div class="home-local-badge hidden shrink-0 sm:flex">
				<span class="h-2 w-2 rounded-full bg-emerald-400"></span>
				Local Only
			</div>
		</header>

		{#if vm.isLoading}
			<div class="grid place-items-center py-24">
				<p class="text-opacity-background-60 animate-pulse text-sm">Loading your library...</p>
			</div>
		{:else if vm.stats}
			<div class="flex flex-col gap-6">
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
					<HomeStatCard
						icon={IconType.MusicListTypeMusic}
						label="Artists"
						value={vm.stats.artistCount}
						accent={vm.accentColor}
					/>
					<HomeStatCard
						icon={IconType.MusicListTypeAlbum}
						label="Albums"
						value={vm.stats.albumCount}
						accent={vm.accentColor}
						onclick={() => (musicStore.listType = MusicListType.Album)}
					/>
					<HomeStatCard
						icon={IconType.Note}
						label="Tracks"
						value={vm.stats.trackCount}
						accent={vm.accentColor}
						onclick={() => (musicStore.listType = MusicListType.Music)}
					/>
					<HomeStatCard
						icon={IconType.Visualizer}
						label="Listened"
						value={StatsService.formatListenTime(vm.stats.totalListenSeconds)}
						accent={vm.accentColor}
					/>
				</div>

				{#if vm.focusMixes.length > 0}
					<section class="min-w-0">
						<HomeSectionHeader title="Focus" />
						<div class="home-carousel -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
							{#each vm.focusMixes as mix (mix.id)}
								<HomeFocusCard
									{mix}
									accent={vm.accentColor}
									onplay={(shuffle) => vm.playMix(mix, shuffle)}
								/>
							{/each}
						</div>
					</section>
				{/if}

				<div class="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
					<HomeGenreChart
						stats={vm.genreStats}
						libraryBased={vm.genreStatsFromLibrary}
						accent={vm.accentColor}
					/>
					<HomeActivityPanel
						items={vm.activityItems}
						tab={vm.activityTab}
						accent={vm.accentColor}
						ontabchange={(t) => (vm.activityTab = t)}
						onplay={(album) => vm.playAlbum(album)}
					/>
				</div>

				{#if albumCarousel.length > 0}
					<section class="min-w-0">
						<HomeSectionHeader title="Albums">
							{#snippet actions()}
								<button
									class="text-opacity-background-60 text-xs transition-colors hover:text-white"
									onclick={() => (musicStore.listType = MusicListType.Album)}
								>
									See all
								</button>
							{/snippet}
						</HomeSectionHeader>
						<div class="home-carousel -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
							{#each albumCarousel as albumIndex}
								{#await TauriLibraryAPI.getAlbumFirstByIndex(albumIndex, '', true) then music}
									{#if music}
										<HomeMediaTile
											title={music.album ?? 'Unknown'}
											subtitle={music.albumArtist ?? music.artist ?? ''}
											path={music.path}
											accent={vm.accentColor}
											onopen={() => openAlbum(music.path)}
											onplay={() =>
												TauriLibraryAPI.collectionAddAndPlay({
													type: CollectionType.Album,
													name: music.album!
												})}
										/>
									{/if}
								{/await}
							{/each}
						</div>
					</section>
				{/if}

				{#if vm.artists.length > 0}
					<section class="min-w-0">
						<HomeSectionHeader title="Artists" />
						<div class="home-carousel -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
							{#each vm.artists as artist (artist.name)}
								<HomeArtistTile
									{artist}
									accent={vm.accentColor}
									onplay={() => vm.playArtist(artist.name)}
								/>
							{/each}
						</div>
					</section>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.home-greeting {
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.home-local-badge {
		color: rgb(167, 243, 208);
	}

	.home-carousel {
		scrollbar-width: none;
		&::-webkit-scrollbar {
			display: none;
		}
	}

	:global(.home-stat-card:disabled) {
		cursor: default;
	}
</style>
