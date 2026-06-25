<script lang="ts">
	import { onMount } from 'svelte';
	import { isMacos } from '$lib/platform';
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
</script>

<div class="home-dashboard scrollbar-hidden h-full overflow-y-auto pb-32">
	<div class="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
		<!-- Greeting -->
		<header class="mb-8 flex items-start justify-between gap-4">
			<div>
				<h1 class="home-greeting">{vm.greeting}</h1>
				<p class="text-opacity-background-70 mt-2 text-sm">
					Your local library — private, offline, and yours.
				</p>
			</div>
			<div class="home-local-badge hidden sm:flex">
				<span class="h-2 w-2 rounded-full bg-emerald-400"></span>
				Local Only
			</div>
		</header>

		{#if vm.isLoading}
			<div class="grid place-items-center py-24">
				<p class="text-opacity-background-60 animate-pulse text-sm">Loading your library...</p>
			</div>
		{:else if vm.stats}
			<div class="grid gap-8">
				<!-- Stats row -->
				<div class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
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

				<!-- Focus mixes -->
				{#if vm.focusMixes.length > 0}
					<section>
						<h2 class="home-section-title mb-4">Focus</h2>
						<div class="home-carousel -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
							{#each vm.focusMixes as mix}
								<HomeFocusCard
									{mix}
									accent={vm.accentColor}
									onplay={(shuffle) => vm.playMix(mix, shuffle)}
								/>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Genre chart -->
				<HomeGenreChart stats={vm.genreStats} accent={vm.accentColor} />

				<!-- Recent activity -->
				<HomeActivityPanel
					items={vm.activityItems}
					tab={vm.activityTab}
					accent={vm.accentColor}
					ontabchange={(t) => (vm.activityTab = t)}
					onplay={(album) => vm.playAlbum(album)}
				/>

				<!-- Album carousel -->
				{#if albumCarousel.length > 0}
					<section>
						<h2 class="home-section-title mb-4">Albums</h2>
						<div class="home-carousel -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
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

				<!-- Artist carousel -->
				{#if vm.artists.length > 0}
					<section>
						<h2 class="home-section-title mb-4">Artists</h2>
						<div class="home-carousel -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
							{#each vm.artists as artist}
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
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.home-section-title {
		font-family: Georgia, 'Times New Roman', serif;
		font-size: 1.5rem;
		font-weight: 400;
		letter-spacing: -0.01em;
	}

	.home-local-badge {
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.3);
		color: rgb(167, 243, 208);
	}

	.home-carousel {
		scrollbar-width: none;
		&::-webkit-scrollbar {
			display: none;
		}
	}

	:global(.home-glass-panel) {
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	:global(.home-stat-card:disabled) {
		cursor: default;
	}
</style>
