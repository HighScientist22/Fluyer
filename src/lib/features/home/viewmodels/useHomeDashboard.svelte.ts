import HomeService from '$lib/services/HomeService.svelte';
import AlbumThemeService from '$lib/services/AlbumThemeService.svelte';
import MetadataService from '$lib/services/MetadataService.svelte';
import TauriLibraryAPI from '$lib/tauri/TauriLibraryAPI';
import type {
	ArtistSummary,
	FocusMix,
	GenreStat,
	LibraryStats,
	RecentActivityTab,
	RecentAlbum
} from '$lib/features/home/types';

export function useHomeDashboard() {
	let isLoading = $state(true);
	let stats = $state<LibraryStats | null>(null);
	let recentPlayed = $state<RecentAlbum[]>([]);
	let recentlyAdded = $state<RecentAlbum[]>([]);
	let genreStats = $state<GenreStat[]>([]);
	let genreStatsFromLibrary = $state(false);
	let artists = $state<ArtistSummary[]>([]);
	let focusMixes = $state<FocusMix[]>([]);
	let activityTab = $state<RecentActivityTab>('played');
	let greeting = $state('Welcome back');
	let accentColor = $state('rgb(99, 102, 241)');

	const activityItems = $derived(activityTab === 'played' ? recentPlayed : recentlyAdded);

	async function load() {
		isLoading = true;
		try {
			const data = await HomeService.loadDashboard();
			stats = data.stats;
			recentPlayed = data.recentPlayed;
			recentlyAdded = data.recentlyAdded;
			genreStats = data.genreStats;
			genreStatsFromLibrary = data.genreStatsFromLibrary;
			artists = data.artists;
			focusMixes = data.focusMixes;

			if (recentPlayed.length > 0) {
				const cover = await MetadataService.getMusicCoverArt(
					await TauriLibraryAPI.getMusicByPath(recentPlayed[0].path)
				);
				if (cover) {
					const theme = await AlbumThemeService.extractFromImage(cover, recentPlayed[0].path);
					AlbumThemeService.applyToDocument(theme);
					accentColor = theme.accent;
				}
			}
		} catch (e) {
			console.error('Failed to load home dashboard:', e);
		} finally {
			isLoading = false;
		}
	}

	function setGreeting(name?: string) {
		const hour = new Date().getHours();
		const timeGreeting =
			hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
		greeting = name ? `${timeGreeting}, ${name}` : timeGreeting;
	}

	return {
		get isLoading() {
			return isLoading;
		},
		get stats() {
			return stats;
		},
		get recentPlayed() {
			return recentPlayed;
		},
		get recentlyAdded() {
			return recentlyAdded;
		},
		get genreStats() {
			return genreStats;
		},
		get genreStatsFromLibrary() {
			return genreStatsFromLibrary;
		},
		get artists() {
			return artists;
		},
		get focusMixes() {
			return focusMixes;
		},
		get activityTab() {
			return activityTab;
		},
		set activityTab(value: RecentActivityTab) {
			activityTab = value;
		},
		get activityItems() {
			return activityItems;
		},
		get greeting() {
			return greeting;
		},
		get accentColor() {
			return accentColor;
		},
		load,
		setGreeting,
		playMix: HomeService.playMix,
		playAlbum: HomeService.playAlbum,
		playArtist: HomeService.playArtistTracks
	};
}
