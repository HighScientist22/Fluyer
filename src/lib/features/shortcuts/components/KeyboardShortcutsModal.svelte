<script lang="ts">
	import { Modal } from '$lib/constants/Modal';
	import modalStore from '$lib/stores/modal.svelte';
	import ModalService from '$lib/services/ModalService.svelte';
	import Button from '$lib/ui/components/Button.svelte';
	import View from '$lib/ui/components/View.svelte';
	import { isMacos } from '$lib/platform';

	const mod = isMacos() ? '⌘' : 'Ctrl';

	const shortcuts = [
		{ keys: `${mod} H`, action: 'Go to Home' },
		{ keys: `${mod} K`, action: 'Focus search' },
		{ keys: `${mod} ,`, action: 'Open Settings' },
		{ keys: 'Space', action: 'Play / Pause' },
		{ keys: `${mod} ←`, action: 'Previous track' },
		{ keys: `${mod} →`, action: 'Next track' },
		{ keys: `${mod} /`, action: 'Show shortcuts' },
		{ keys: 'Esc', action: 'Unfocus controls' }
	];

	function close() {
		ModalService.close();
	}
</script>

{#if modalStore.show && modalStore.type === Modal.KeyboardShortcuts}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
	>
		<View class="animate__animated animate__fadeIn mx-3 w-full rounded-xl p-6 md:max-w-md">
			<h2 class="text-lg font-semibold">Keyboard Shortcuts</h2>
			<div class="mt-4 space-y-2">
				{#each shortcuts as { keys, action }}
					<div class="flex items-center justify-between gap-4 py-1.5">
						<span class="text-opacity-background-80 text-sm">{action}</span>
						<kbd
							class="rounded bg-white/10 px-2 py-0.5 font-mono text-xs tracking-wide text-white/90"
							>{keys}</kbd
						>
					</div>
				{/each}
			</div>
			<div class="mt-5 flex justify-end">
				<Button class="rounded px-3 py-1" onclick={close}>Close</Button>
			</div>
		</View>
	</div>
{/if}
