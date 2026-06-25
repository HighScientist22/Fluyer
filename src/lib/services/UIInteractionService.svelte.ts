// @ts-ignore
import musicStore from '$lib/stores/music.svelte';
import { MusicListType } from '$lib/features/music/types';
import MusicPlayerService from '$lib/services/MusicPlayerService.svelte';
import shortcutStore from '$lib/stores/shortcut.svelte';
import { Modal } from '$lib/constants/Modal';
import ModalService from '$lib/services/ModalService.svelte';
import filterStore from '$lib/stores/filter.svelte';

function isTypingTarget(target: Element) {
	return target.matches('input, textarea, select, [contenteditable="true"]');
}

function isMeta(e: KeyboardEvent) {
	return e.metaKey || e.ctrlKey;
}

const UIInteractionService = {
	initialize: async () => {
		UIInteractionService.autoScrollOverflowText();
		UIInteractionService.handleKeyControls();
	},
	autoScrollOverflowText: () => {},
	handleKeyControls: () => {
		document.addEventListener(
			'keydown',
			function (e) {
				const target = e.target as Element;

				// Global shortcuts (work even when not focused on body)
				if (isMeta(e) && e.key.toLowerCase() === 'h' && !isTypingTarget(target)) {
					e.preventDefault();
					filterStore.album = null;
					musicStore.listType = MusicListType.Home;
					return;
				}

				if (isMeta(e) && e.key.toLowerCase() === 'k') {
					e.preventDefault();
					shortcutStore.focusSearch++;
					return;
				}

				if (isMeta(e) && e.key === '/') {
					e.preventDefault();
					shortcutStore.showHelp = true;
					ModalService.open(Modal.KeyboardShortcuts);
					return;
				}

				if (isMeta(e) && e.key === 'ArrowRight' && !isTypingTarget(target)) {
					e.preventDefault();
					MusicPlayerService.next();
					return;
				}

				if (isMeta(e) && e.key === 'ArrowLeft' && !isTypingTarget(target)) {
					e.preventDefault();
					MusicPlayerService.previous();
					return;
				}

				const handledKeys = ['Space', 'Tab', 'Escape'];

				if (target == document.body && handledKeys.includes(e.code || e.key)) e.preventDefault();

				if (e.code === 'Space') {
					if (target.matches('a, button, select')) {
						e.preventDefault();
						e.stopPropagation();
						// @ts-ignore
						target.blur();

						document.body.focus();
					}
					if (isTypingTarget(target)) return;

					if (musicStore.isPlaying) {
						musicStore.isPlaying = false;
						MusicPlayerService.pause();
					} else {
						MusicPlayerService.play();
					}
				} else if (['Tab', 'Escape'].includes(e.key)) {
					if (target.matches('a, button, select')) {
						e.preventDefault();
						e.stopPropagation();
						// @ts-ignore
						target.blur();

						document.body.focus();
					}
					if (isTypingTarget(target)) return;
				}
			},
			true
		);
	}
};

export default UIInteractionService;
