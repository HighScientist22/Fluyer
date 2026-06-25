import type { PlaylistData } from '$lib/features/music/types';
import { COVER_ART_DEBOUNCE_DELAY } from '$lib/services/CoverArtService.svelte';
import MetadataService from '$lib/services/MetadataService.svelte';
import PlaylistService from '$lib/services/PlaylistService.svelte';
import SmartPlaylistService from '$lib/services/SmartPlaylistService.svelte';
import TauriLibraryAPI from '$lib/tauri/TauriLibraryAPI';

export function usePlaylistItem(getPlaylist: () => PlaylistData, getVisible: () => boolean) {
	let coverArt = $state<Promise<string | null> | null>(null);
	let currentBlobUrl: string | null = null;

	$effect(() => {
		const isVisible = getVisible();
		if (!isVisible) return;

		let cancelled = false;
		const timeoutId = setTimeout(async () => {
			const playlist = getPlaylist();
			let imagePromise: Promise<string | null>;

			if (playlist.isSmart) {
				const paths = await SmartPlaylistService.resolve(playlist);
				const firstPath = paths[0];
				if (firstPath) {
					const music = await TauriLibraryAPI.getMusicByPath(firstPath);
					imagePromise = MetadataService.getMusicCoverArt(music ?? undefined);
				} else {
					imagePromise = Promise.resolve(null);
				}
			} else if (playlist.id !== undefined) {
				imagePromise = PlaylistService.getCoverArt(playlist.id);
			} else {
				imagePromise = Promise.resolve(null);
			}

			coverArt = imagePromise;

			const url = await imagePromise;
			if (!cancelled) {
				if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
				if (url) currentBlobUrl = url;
			}
		}, COVER_ART_DEBOUNCE_DELAY);

		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
			if (currentBlobUrl) {
				URL.revokeObjectURL(currentBlobUrl);
				currentBlobUrl = null;
			}
		};
	});

	async function selectPlaylist() {
		await PlaylistService.selectPlaylist(getPlaylist());
	}

	return {
		selectPlaylist,
		get coverArt() {
			return coverArt;
		}
	};
}
