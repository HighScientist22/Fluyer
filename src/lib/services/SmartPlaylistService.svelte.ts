import type { PlaylistData } from '$lib/features/music/types';
import type {
	SmartPlaylistData,
	SmartPlaylistPreset,
	SmartPlaylistRule
} from '$lib/features/smart_playlist/types';
import { SMART_PLAYLIST_PRESETS } from '$lib/features/smart_playlist/types';
import TauriSmartPlaylistAPI from '$lib/tauri/TauriSmartPlaylistAPI';

const SmartPlaylistService = {
	toPresetPlaylist: (preset: SmartPlaylistPreset): PlaylistData => {
		const meta = SMART_PLAYLIST_PRESETS.find((p) => p.preset === preset)!;
		return {
			name: meta.name,
			title: meta.name,
			artist: meta.subtitle,
			paths: [],
			isSmart: true,
			smartPreset: preset
		};
	},

	toCustomPlaylist: (smart: SmartPlaylistData): PlaylistData => ({
		id: smart.id,
		name: smart.name,
		title: smart.name,
		artist: 'Smart Playlist',
		paths: [],
		isSmart: true,
		smartRule: smart.rules
	}),

	getPresetPlaylists: (): PlaylistData[] =>
		SMART_PLAYLIST_PRESETS.map((p) => SmartPlaylistService.toPresetPlaylist(p.preset)),

	loadCustomPlaylists: async (): Promise<PlaylistData[]> => {
		const all = await TauriSmartPlaylistAPI.getAll();
		return all.map(SmartPlaylistService.toCustomPlaylist);
	},

	resolve: async (playlist: PlaylistData): Promise<string[]> => {
		if (playlist.smartPreset) {
			return TauriSmartPlaylistAPI.resolvePreset(playlist.smartPreset);
		}
		if (playlist.smartRule) {
			return TauriSmartPlaylistAPI.resolveRule(playlist.smartRule);
		}
		return playlist.paths;
	},

	create: async (name: string, rule: SmartPlaylistRule) => {
		await TauriSmartPlaylistAPI.create(name, rule);
	},

	delete: async (id: number) => {
		await TauriSmartPlaylistAPI.delete(id);
	},

	previewCount: async (rule: SmartPlaylistRule): Promise<number> => {
		const paths = await TauriSmartPlaylistAPI.resolveRule(rule, 10000);
		return paths.length;
	}
};

export default SmartPlaylistService;
