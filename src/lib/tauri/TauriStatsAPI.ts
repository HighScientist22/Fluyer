import { invoke } from '@tauri-apps/api/core';
import { TauriCommands } from '$lib/constants/TauriCommands';
import type {
	ArtistSummary,
	FocusMix,
	GenreStat,
	LibraryStats,
	RecentAlbum
} from '$lib/features/home/types';

const TauriStatsAPI = {
	recordPlay: (path: string, durationSeconds: number) =>
		invoke<void>(TauriCommands.STATS_RECORD_PLAY, { path, durationSeconds }),

	getLibraryStats: () => invoke<LibraryStats>(TauriCommands.STATS_LIBRARY_GET),

	getRecentPlayed: (limit = 15) =>
		invoke<RecentAlbum[]>(TauriCommands.STATS_RECENT_PLAYED_GET, { limit }),

	getRecentlyAdded: (limit = 15) =>
		invoke<RecentAlbum[]>(TauriCommands.STATS_RECENTLY_ADDED_GET, { limit }),

	getGenreStats: (limit = 8) => invoke<GenreStat[]>(TauriCommands.STATS_GENRE_GET, { limit }),

	getArtists: (limit = 12) => invoke<ArtistSummary[]>(TauriCommands.STATS_ARTISTS_GET, { limit }),

	toggleFavorite: (path: string) => invoke<boolean>(TauriCommands.FAVORITES_TOGGLE, { path }),

	isFavorite: (path: string) => invoke<boolean>(TauriCommands.FAVORITES_IS, { path }),

	getFavorites: () => invoke<string[]>(TauriCommands.FAVORITES_ALL_GET)
};

export default TauriStatsAPI;
