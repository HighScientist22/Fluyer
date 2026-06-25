import type {
	FocusMix,
	LibraryStats,
	RecentAlbum,
	ArtistSummary,
	GenreStat
} from '$lib/features/home/types';
import TauriStatsAPI from '$lib/tauri/TauriStatsAPI';
import TauriLibraryAPI, { CollectionType } from '$lib/tauri/TauriLibraryAPI';
import type { MusicData } from '$lib/features/music/types';

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
		const [stats, recentPlayed, recentlyAdded, playGenreStats, artists, favorites, playedPaths] =
			await Promise.all([
				TauriStatsAPI.getLibraryStats(),
				TauriStatsAPI.getRecentPlayed(15),
				TauriStatsAPI.getRecentlyAdded(15),
				TauriStatsAPI.getGenreStats(5),
				TauriStatsAPI.getArtists(12),
				TauriStatsAPI.getFavorites(),
				getPlayedPaths()
			]);

		const totalPlays = playGenreStats.reduce((sum, g) => sum + g.playCount, 0);
		const genreStatsFromLibrary = playGenreStats.length < 2 || totalPlays < 5;
		const genreStats = genreStatsFromLibrary
			? await getLibraryGenreStats(5)
			: playGenreStats;

		const focusMixes = await buildFocusMixes(recentPlayed, favorites, playedPaths);

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

function normalizeGenreKey(genre: string): string {
	return genre
		.toLowerCase()
		.replace(/[&/]/g, ' ')
		.replace(/[-_]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

async function getLibraryGenreStats(limit: number): Promise<GenreStat[]> {
	const count = await TauriLibraryAPI.getMusicCount({ search: '', sortAsc: true });
	const map = new Map<string, { display: string; count: number }>();
	const scanLimit = Math.min(count, 4000);

	for (let i = 0; i < scanLimit; i++) {
		const track = await TauriLibraryAPI.getMusicByIndex(i, { search: '', sortAsc: true });
		const raw = track?.genre?.split(/[,;/]/)[0]?.trim();
		if (!raw) continue;
		const key = normalizeGenreKey(raw);
		const existing = map.get(key);
		if (existing) {
			existing.count += 1;
		} else {
			map.set(key, { display: raw, count: 1 });
		}
	}

	return [...map.values()]
		.sort((a, b) => b.count - a.count)
		.slice(0, limit)
		.map(({ display, count: trackCount }) => ({
			genre: display,
			playCount: trackCount,
			listenSeconds: 0
		}));
}

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

	const genreMap = new Map<string, MusicData[]>();
	const count = await TauriLibraryAPI.getMusicCount({ search: '', sortAsc: true });
	for (let i = 0; i < Math.min(count, 3000); i++) {
		const track = await TauriLibraryAPI.getMusicByIndex(i, { search: '', sortAsc: true });
		if (!track?.genre) continue;
		const genre = track.genre.split(/[,;/]/)[0].trim();
		if (!genre) continue;
		const key = normalizeGenreKey(genre);
		if (!genreMap.has(key)) genreMap.set(key, []);
		genreMap.get(key)!.push(track);
	}

	const seenGenreKeys = new Set<string>();
	const discoverCandidates = [...genreMap.entries()]
		.map(([key, tracks]) => {
			const unheard = tracks.filter((t) => !playedPaths.has(t.path));
			const display = tracks[0]?.genre?.split(/[,;/]/)[0]?.trim() ?? key;
			return { key, display, unheard };
		})
		.filter((c) => c.unheard.length >= 8)
		.sort((a, b) => b.unheard.length - a.unheard.length);

	for (const { key, display, unheard } of discoverCandidates) {
		if (seenGenreKeys.has(key)) continue;
		seenGenreKeys.add(key);
		mixes.push({
			id: `unheard-${key.replace(/\s+/g, '-')}`,
			title: `Discover ${display}`,
			subtitle: `${unheard.length} unheard tracks`,
			paths: unheard.slice(0, 30).map((t) => t.path),
			artworkPath: unheard[0].path,
			prefersShuffle: true
		});
		if (mixes.length >= 5) break;
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
