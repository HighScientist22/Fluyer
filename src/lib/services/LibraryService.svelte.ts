import musicStore from '$lib/stores/music.svelte';
import TauriLibraryAPI from '$lib/tauri/TauriLibraryAPI';
import PersistentStoreService from './PersistentStoreService.svelte';

const LibraryService = {
	initialize: async () => {
		await LibraryService.loadMusicList();
	},
	loadMusicList: async () => {
		try {
			if ((await PersistentStoreService.musicPath.get()).length === 0) {
				musicStore.isLibraryLoaded = false;
				return;
			}

			const now = performance.now();
			await TauriLibraryAPI.sync();
			const counts = await TauriLibraryAPI.load();

			console.log(`Scanning music list took ${performance.now() - now} ms`);

			musicStore.listCount = counts.musicCount;
			musicStore.albumCount = counts.albumCount;
			musicStore.isLibraryLoaded = true;
		} catch (e) {
			console.error('Failed to load library:', e);
			musicStore.isLibraryLoaded = false;
		}
	}
};

export default LibraryService;
