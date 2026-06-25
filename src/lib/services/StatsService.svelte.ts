import TauriStatsAPI from '$lib/tauri/TauriStatsAPI';
import favoritesStore from '$lib/stores/favorites.svelte';
import type { LibraryStats } from '$lib/features/home/types';

let lastRecordedPath: string | null = null;

const StatsService = {
	initialize: async () => {
		await StatsService.loadFavorites();
	},

	loadFavorites: async () => {
		try {
			const paths = await TauriStatsAPI.getFavorites();
			favoritesStore.paths = new Set(paths);
		} catch (e) {
			console.warn('Failed to load favorites:', e);
		}
	},

	isFavorite: (path: string) => favoritesStore.paths.has(path),

	toggleFavorite: async (path: string): Promise<boolean> => {
		const isNowFavorite = await TauriStatsAPI.toggleFavorite(path);
		if (isNowFavorite) {
			favoritesStore.paths.add(path);
		} else {
			favoritesStore.paths.delete(path);
		}
		return isNowFavorite;
	},

	recordPlay: async (path: string, durationSeconds: number) => {
		if (!path || lastRecordedPath === path) return;
		lastRecordedPath = path;
		try {
			await TauriStatsAPI.recordPlay(path, durationSeconds);
		} catch (e) {
			console.warn('Failed to record play:', e);
		}
	},

	resetPlayTracking: () => {
		lastRecordedPath = null;
	},

	getLibraryStats: () => TauriStatsAPI.getLibraryStats(),

	getRecentPlayed: (limit?: number) => TauriStatsAPI.getRecentPlayed(limit),

	getRecentlyAdded: (limit?: number) => TauriStatsAPI.getRecentlyAdded(limit),

	getGenreStats: (limit?: number) => TauriStatsAPI.getGenreStats(limit),

	getArtists: (limit?: number) => TauriStatsAPI.getArtists(limit),

	formatListenTime: (seconds: number): string => {
		if (seconds < 60) return '< 1 min';
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours === 0) return `${minutes} min`;
		if (minutes === 0) return `${hours} hr`;
		return `${hours} hr ${minutes} min`;
	},

	formatRelativeTime: (isoDate: string): string => {
		const date = new Date(isoDate + (isoDate.endsWith('Z') ? '' : 'Z'));
		const now = Date.now();
		const diff = now - date.getTime();
		const minutes = Math.floor(diff / 60000);
		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString();
	}
};

export default StatsService;
