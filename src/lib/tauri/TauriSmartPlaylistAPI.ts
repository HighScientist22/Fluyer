import { invoke } from '@tauri-apps/api/core';
import { TauriCommands } from '$lib/constants/TauriCommands';
import type { SmartPlaylistData, SmartPlaylistRule } from '$lib/features/smart_playlist/types';

const TauriSmartPlaylistAPI = {
	getAll: () => invoke<SmartPlaylistData[]>(TauriCommands.SMART_PLAYLIST_ALL_GET),

	create: (name: string, rule: SmartPlaylistRule) =>
		invoke<number>(TauriCommands.SMART_PLAYLIST_CREATE, { name, rule }),

	delete: (id: number) => invoke<void>(TauriCommands.SMART_PLAYLIST_DELETE, { id }),

	resolvePreset: (preset: string, limit = 500) =>
		invoke<string[]>(TauriCommands.SMART_PLAYLIST_RESOLVE_PRESET, { preset, limit }),

	resolveRule: (rule: SmartPlaylistRule, limit = 500) =>
		invoke<string[]>(TauriCommands.SMART_PLAYLIST_RESOLVE_RULE, { rule, limit })
};

export default TauriSmartPlaylistAPI;
