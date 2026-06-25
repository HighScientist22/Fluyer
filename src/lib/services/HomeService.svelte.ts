import type { FocusMix, LibraryStats, RecentAlbum, ArtistSummary, GenreStat } from '$lib/features/home/types';
import TauriStatsAPI from '$lib/tauri/TauriStatsAPI';
import TauriLibraryAPI, { CollectionType } from '$lib/tauri/TauriLibraryAPI';
import type { MusicData } from '$lib/features/music/types';

const HomeService = {
	loadDashboard: async (): Promise<{
		stats: LibraryStats;
		recentPlayed: RecentAlbum[];
		recentlyAdded: RecentAlbum[];
		genreStats: GenreStat[];
		artists: ArtistSummary[];
		focusMixes: FocusMix[];
	}> => {
		const [stats, recentPlayed, recentlyAdded, genreStats, artists, favorites, playedPaths] =
			await Promise.all([
				TauriStatsAPI.getLibraryStats(),
				TauriStatsAPI.getRecentPlayed(15),
				TauriStatsAPI.getRecentlyAdded(15),
				TauriStatsAPI.getGenreStats(5),
				TauriStatsAPI.getArtists(12),
				TauriStatsAPI.getFavorites(),
				getPlayedPaths()
			]);

		const focusMixes = await buildFocusMixes(recentPlayed, favorites, playedPaths);

		return { stats, recentPlayed, recentlyAdded, genreStats, artists, focusMixes };
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

async function getPlayedPaths(): Promise<Set<string>> {
	try {
		const recent = await TauriStatsAPI.getRecentPlayed(500);
		return new Set(recent.map((r) => r.path));
	} catch {
		return new Set();
	}
}

async function buildFocusMixes(
	recentPlayed: RecentAlbum[],
	favoritePaths: string[],
	playedPaths: Set<string>
): Promise<FocusMix[]> {
	const mixes: FocusMix[] = [];

	// Jump Back In
	if (recentPlayed.length > 0) {
		const last = recentPlayed[0];
		const tracks = await getAlbumTracks(last.album);
		if (tracks.length > 0) {
			mixes.push({
				id: 'jump-back-in',
				title: 'Jump Back In',
				subtitle: last.album,
				paths: tracks.map((t) => t.path),
				artworkPath: last.path,
				prefersShuffle: false
			});
		}
	}

	// Favorites Focus
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

	// Genre Discovery - find unplayed tracks in top genres
	const genreMap = new Map<string, MusicData[]>();
	const count = await TauriLibraryAPI.getMusicCount({ search: '', sortAsc: true });
	for (let i = 0; i < Math.min(count, 2000); i++) {
		const track = await TauriLibraryAPI.getMusicByIndex(i, { search: '', sortAsc: true });
		if (!track?.genre) continue;
		const genre = track.genre.split(/[,;/]/)[0].trim();
		if (!genre) continue;
		if (!genreMap.has(genre)) genreMap.set(genre, []);
		genreMap.get(genre)!.push(track);
	}

	for (const [genre, tracks] of genreMap) {
		const unheard = tracks.filter((t) => !playedPaths.has(t.path));
		if (unheard.length >= 8) {
			mixes.push({
				id: `unheard-${genre.toLowerCase().replace(/\s+/g, '-')}`,
				title: `Discover ${genre}`,
				subtitle: `${unheard.length} unheard tracks`,
				paths: unheard.slice(0, 30).map((t) => t.path),
				artworkPath: unheard[0].path,
				prefersShuffle: true
			});
			if (mixes.length >= 5) break;
		}
	}

	return mixes;
}

async function getAlbumTracks(albumName: string): Promise<MusicData[]> {
	const count = await TauriLibraryAPI.getMusicCount({
		search: '',
		sortAsc: true,
		albumName
	});
	const tracks: MusicData[] = [];
	for (let i = 0; i < count; i++) {
		const track = await TauriLibraryAPI.getMusicByIndex(i, {
			search: '',
			sortAsc: true,
			albumName
		});
		if (track) tracks.push(track);
	}
	return tracks;
}

export default HomeService;
