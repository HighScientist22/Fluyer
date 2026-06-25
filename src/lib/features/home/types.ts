export interface LibraryStats {
	artistCount: number;
	albumCount: number;
	trackCount: number;
	totalListenSeconds: number;
	totalLibrarySeconds: number;
}

export interface GenreStat {
	genre: string;
	playCount: number;
	listenSeconds: number;
}

export interface RecentAlbum {
	album: string;
	artist: string;
	path: string;
	playedAt?: string;
	badge?: string;
}

export interface ArtistSummary {
	name: string;
	albumCount: number;
	trackCount: number;
}

export interface FocusMix {
	id: string;
	title: string;
	subtitle: string;
	paths: string[];
	artworkPath?: string;
	prefersShuffle: boolean;
}

export type RecentActivityTab = 'played' | 'added';
