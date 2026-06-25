import type {
	FocusMix,
	LibraryStats,
	RecentAlbum,
	ArtistSummary,
	GenreStat
} from '$lib/features/home/types';
import TauriStatsAPI from '$lib/tauri/TauriStatsAPI';
import TauriLibraryAPI, { CollectionType } from '$lib/tauri/TauriLibraryAPI';

const HomeService = {
	loadDashboard: async (): Promise<{
		stats: LibraryStats;
		recentPlayed: RecentAlbum[];
		recentlyAdded: RecentAlbum[];
		genreStats: GenreStat[];
		genreStatsFromLibrary: boolean;
		artists: ArtistSummary[];
		focusMixes: FocusMix[];
	}> => {
		const [stats, recentPlayed, recentlyAdded, playGenreStats, artists, favorites] =
			await Promise.all([
				TauriStatsAPI.getLibraryStats(),
				TauriStatsAPI.getRecentPlayed(15),
				TauriStatsAPI.getRecentlyAdded(15),
				TauriStatsAPI.getGenreStats(5),
				TauriStatsAPI.getArtists(12),
				TauriStatsAPI.getFavorites()
			]);

		const totalPlays = playGenreStats.reduce((sum, g) => sum + g.playCount, 0);
		const genreStatsFromLibrary = playGenreStats.length < 2 || totalPlays < 5;
		const genreStats = genreStatsFromLibrary
			? await TauriStatsAPI.getLibraryGenreStats(5)
			: playGenreStats;

		const focusMixes = await buildFocusMixes(recentPlayed, favorites);

		return {
			stats,
			recentPlayed,
			recentlyAdded,
			genreStats,
			genreStatsFromLibrary,
			artists,
			focusMixes
		};
	},

	playMix: async (mix: FocusMix, shuffle = false) => {
		const context = { type: CollectionType.Playlist, paths: mix.paths };
		if (shuffle) {
			await TauriLibraryAPI.collectionShuffleAndPlay(context);
		} else {
			await TauriLibraryAPI.collectionAddAndPlay(context);
		}
	},

	playAlbum: async (album: RecentAlbum) => {
		const music = await TauriLibraryAPI.getMusicByPath(album.path);
		if (!music?.album) return;
		await TauriLibraryAPI.collectionAddAndPlay({ type: CollectionType.Album, name: music.album });
	},

	playArtistTracks: async (artistName: string) => {
		const count = await TauriLibraryAPI.getMusicCount({ search: '', sortAsc: true });
		const paths: string[] = [];
		for (let i = 0; i < count; i++) {
			const track = await TauriLibraryAPI.getMusicByIndex(i, { search: '', sortAsc: true });
			if (track?.artist?.toLowerCase().includes(artistName.toLowerCase())) {
				paths.push(track.path);
			}
		}
		if (paths.length > 0) {
			await TauriLibraryAPI.collectionAddAndPlay({
				type: CollectionType.Playlist,
				paths
			});
		}
	}
};

async function buildFocusMixes(
	recentPlayed: RecentAlbum[],
	favoritePaths: string[]
): Promise<FocusMix[]> {
	const mixes: FocusMix[] = [];

	if (recentPlayed.length > 0) {
		const last = recentPlayed[0];
		const paths = await TauriStatsAPI.getAlbumTrackPaths(last.album);
		if (paths.length > 0) {
			mixes.push({
				id: 'jump-back-in',
				title: 'Jump Back In',
				subtitle: last.album,
				paths,
				artworkPath: last.path,
				prefersShuffle: false
			});
		}
	}

	if (favoritePaths.length >= 3) {
		mixes.push({
			id: 'favorites-focus',
			title: 'Your Favorites',
			subtitle: `${favoritePaths.length} loved tracks`,
			paths: favoritePaths.slice(0, 50),
			artworkPath: favoritePaths[0],
			prefersShuffle: true
		});
	}

	const discoverMixes = await TauriStatsAPI.getDiscoverMixes(4);
	mixes.push(...discoverMixes);

	return mixes.slice(0, 5);
}

export default HomeService;
