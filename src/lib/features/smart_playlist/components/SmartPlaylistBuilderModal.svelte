<script lang="ts">
	import { Modal } from '$lib/constants/Modal';
	import modalStore from '$lib/stores/modal.svelte';
	import ModalService from '$lib/services/ModalService.svelte';
	import Button from '$lib/ui/components/Button.svelte';
	import View from '$lib/ui/components/View.svelte';
	import Input from '$lib/ui/components/Input.svelte';
	import SmartPlaylistService from '$lib/services/SmartPlaylistService.svelte';
	import PlaylistService from '$lib/services/PlaylistService.svelte';
	import {
		SMART_CRITERION_FIELDS,
		SMART_CRITERION_MATCHES,
		type SmartCriterion,
		type SmartCriterionField,
		type SmartCriterionMatch
	} from '$lib/features/smart_playlist/types';

	let name = $state('');
	let matchAll = $state(true);
	let criteria = $state<SmartCriterion[]>([
		{ field: 'genre', match: 'contains', value: '' }
	]);
	let previewCount = $state(0);
	let isSubmitting = $state(false);

	$effect(() => {
		const rule = { matchAll, criteria };
		SmartPlaylistService.previewCount(rule).then((c) => (previewCount = c));
	});

	function addCriterion() {
		criteria = [...criteria, { field: 'genre', match: 'contains', value: '' }];
	}

	function removeCriterion(index: number) {
		criteria = criteria.filter((_, i) => i !== index);
	}

	function updateCriterion(index: number, patch: Partial<SmartCriterion>) {
		criteria = criteria.map((c, i) => (i === index ? { ...c, ...patch } : c));
	}

	function isBooleanField(field: SmartCriterionField) {
		return SMART_CRITERION_FIELDS.find((f) => f.value === field)?.boolean ?? false;
	}

	async function handleSubmit() {
		if (criteria.length === 0) return;
		isSubmitting = true;
		await SmartPlaylistService.create(name.trim() || 'Smart Playlist', { matchAll, criteria });
		await PlaylistService.loadPlaylist();
		close();
		isSubmitting = false;
	}

	function close() {
		name = '';
		matchAll = true;
		criteria = [{ field: 'genre', match: 'contains', value: '' }];
		ModalService.close();
	}
</script>

{#if modalStore.show && modalStore.type === Modal.SmartPlaylist}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
	>
		<View class="animate__animated animate__fadeIn mx-3 max-h-[85vh] w-full overflow-y-auto rounded-xl p-6 md:max-w-lg">
			<h2 class="text-lg font-semibold">Create Smart Playlist</h2>
			<p class="text-opacity-background-70 mt-1 text-sm">
				Build a playlist that updates automatically from your library.
			</p>

			<div class="mt-5 space-y-4">
				<div>
					<label class="mb-1 block text-sm font-medium" for="smart-name">Name</label>
					<Input id="smart-name" class="rounded" bind:value={name} placeholder="My Smart Playlist" />
				</div>

				<div>
					<p class="mb-2 text-sm font-medium">Match</p>
					<div class="flex gap-2">
						<Button
							class="rounded px-3 py-1 text-sm {matchAll ? 'bg-white/20' : ''}"
							onclick={() => (matchAll = true)}>All criteria</Button
						>
						<Button
							class="rounded px-3 py-1 text-sm {!matchAll ? 'bg-white/20' : ''}"
							onclick={() => (matchAll = false)}>Any criterion</Button
						>
					</div>
				</div>

				<div class="space-y-3">
					<p class="text-sm font-medium">Criteria</p>
					{#each criteria as criterion, index}
						<div class="home-glass-panel rounded-lg p-3">
							<div class="grid gap-2">
								<select
									class="rounded bg-white/10 px-2 py-1.5 text-sm"
									value={criterion.field}
									onchange={(e) =>
										updateCriterion(index, {
											field: (e.currentTarget as HTMLSelectElement).value as SmartCriterionField,
											value: isBooleanField(
												(e.currentTarget as HTMLSelectElement).value as SmartCriterionField
											)
												? 'true'
												: ''
										})}
								>
									{#each SMART_CRITERION_FIELDS as field}
										<option value={field.value}>{field.label}</option>
									{/each}
								</select>

								{#if isBooleanField(criterion.field)}
									<select
										class="rounded bg-white/10 px-2 py-1.5 text-sm"
										value={criterion.value}
										onchange={(e) =>
											updateCriterion(index, {
												value: (e.currentTarget as HTMLSelectElement).value
											})}
									>
										<option value="true">Yes</option>
										<option value="false">No</option>
									</select>
								{:else}
									<select
										class="rounded bg-white/10 px-2 py-1.5 text-sm"
										value={criterion.match}
										onchange={(e) =>
											updateCriterion(index, {
												match: (e.currentTarget as HTMLSelectElement)
													.value as SmartCriterionMatch
											})}
									>
										{#each SMART_CRITERION_MATCHES as m}
											<option value={m.value}>{m.label}</option>
										{/each}
									</select>
									<Input
										class="rounded"
										value={criterion.value}
										oninput={(e) =>
											updateCriterion(index, {
												value: (e.currentTarget as HTMLInputElement).value
											})}
										placeholder="Value..."
									/>
								{/if}
							</div>
							{#if criteria.length > 1}
								<button
									class="text-opacity-background-60 mt-2 text-xs hover:text-white"
									onclick={() => removeCriterion(index)}>Remove</button
								>
							{/if}
						</div>
					{/each}
					<Button class="rounded px-3 py-1 text-sm" onclick={addCriterion}>+ Add Criterion</Button>
				</div>

				<p class="text-opacity-background-70 text-sm">{previewCount} matching tracks</p>

				<div class="flex justify-end gap-2 pt-2">
					<Button class="rounded px-3 py-1" onclick={close}>Cancel</Button>
					<Button class="rounded px-3 py-1" onclick={handleSubmit} disabled={isSubmitting}>
						{isSubmitting ? 'Creating...' : 'Create'}
					</Button>
				</div>
			</div>
		</View>
	</div>
{/if}
