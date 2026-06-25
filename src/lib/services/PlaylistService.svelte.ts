import { Modal } from '$lib/constants/Modal';
import { MusicConfig } from '$lib/constants/MusicConfig';
import type { PlaylistData } from '$lib/features/music/types';
import playlistStore from '$lib/stores/playlist.svelte';
import TauriPlaylistAPI from '$lib/tauri/TauriPlaylistAPI';
import MetadataService from './MetadataService.svelte';
import ModalService from './ModalService.svelte';
import SmartPlaylistService from './SmartPlaylistService.svelte';

const PlaylistService = {
	initialize: () => {
		PlaylistService.loadPlaylist();
	},
	loadPlaylist: async () => {
		const [manual, customSmart] = await Promise.all([
			TauriPlaylistAPI.getAll(),
			SmartPlaylistService.loadCustomPlaylists()
		]);
		playlistStore.list = [
			...SmartPlaylistService.getPresetPlaylists(),
			...customSmart,
			...manual
		];
	},
	selectPlaylist: async (playlist: PlaylistData) => {
		if (playlist.isSmart) {
			const paths = await SmartPlaylistService.resolve(playlist);
			playlistStore.selectedPlaylist = { ...playlist, paths };
		} else {
			playlistStore.selectedPlaylist = playlist;
		}
	},
	showModal: () => {
		ModalService.open(Modal.CreatePlaylist);
	},
	showSmartPlaylistModal: () => {
		ModalService.open(Modal.SmartPlaylist);
	},
	requestUploadImage: async () => {
		const uploadedImagePath = await TauriPlaylistAPI.uploadImage();
		return uploadedImagePath;
	},
	requestCreate: () => {
		playlistStore.isCreating = true;
		playlistStore.selectedPaths = [];
		playlistStore.selectedPlaylist = null;
	},
	confirmCreate: () => {
		if (playlistStore.selectedPaths.length === 0) {
			playlistStore.isCreating = false;
			return;
		}
		PlaylistService.showModal();
	},
	cancelCreation: () => {
		ModalService.close();
		playlistStore.isCreating = false;
		playlistStore.selectedPaths = [];
	},
	create: async (playlist: PlaylistData) => {
		await TauriPlaylistAPI.create(playlist);
	},
	getCoverArt: async (id: number) => {
		try {
			const arrayBuffer = await TauriPlaylistAPI.readImage(id);
			if (arrayBuffer !== null && MetadataService.isValidImageBuffer(arrayBuffer)) {
				const blob = new Blob([arrayBuffer], { type: 'image/png' });
				return URL.createObjectURL(blob);
			}
		} catch (e) {
			console.error(e);
		}
		return MusicConfig.defaultCoverArt;
	},
	delete: async (playlist: PlaylistData) => {
		if (playlist.isSmart && playlist.smartRule && playlist.id) {
			await SmartPlaylistService.delete(playlist.id);
		} else if (playlist.id && !playlist.isSmart) {
			await TauriPlaylistAPI.delete(playlist.id);
		}
		playlistStore.selectedPlaylist = null;
		await PlaylistService.loadPlaylist();
	}
};

export default PlaylistService;
