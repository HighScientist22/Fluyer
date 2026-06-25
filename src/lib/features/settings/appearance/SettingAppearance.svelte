<script lang="ts">
	import SettingLabel from '$lib/features/settings/SettingLabel.svelte';
	import SettingInput from '$lib/features/settings/SettingInput.svelte';
	import { AppTheme, LiquidGlassMode } from '$lib/features/settings/appearance/types';
	import settingStore from '$lib/stores/setting.svelte';
	import ThemeService from '$lib/services/ThemeService.svelte';
	import ToastService from '$lib/services/ToastService.svelte';

	async function onAppThemeChange(
		e: Event & { currentTarget: EventTarget & HTMLInputElement }
	) {
		const value = e.currentTarget.value as AppTheme;
		if (value === settingStore.appearance.appTheme) return;
		await ThemeService.setAppTheme(value);
		ToastService.info(`App theme set to ${value}`);
	}

	async function onLiquidGlassChange(
		e: Event & { currentTarget: EventTarget & HTMLInputElement }
	) {
		const value = e.currentTarget.value as LiquidGlassMode;
		if (value === settingStore.appearance.liquidGlassMode) return;
		await ThemeService.setLiquidGlassMode(value);
		ToastService.info(
			`Liquid glass set to ${value === LiquidGlassMode.Tinted ? 'tinted' : 'transparent'}`
		);
	}
</script>

<SettingLabel
	title="Appearance"
	description="Theme and liquid glass styling inspired by Aries on macOS Tahoe."
/>

<SettingInput>
	<p class="text-opacity-background-70 px-3 pb-2 pt-3 text-xs">App Theme</p>
	<label class="grid cursor-pointer grid-cols-[min-content_auto] items-center gap-3 px-3 py-2">
		<input
			type="radio"
			name="appTheme"
			class="h-4 w-4"
			value={AppTheme.System}
			checked={settingStore.appearance.appTheme === AppTheme.System}
			onchange={onAppThemeChange}
		/>
		<div>Follow System</div>
	</label>
	<label class="grid cursor-pointer grid-cols-[min-content_auto] items-center gap-3 px-3 py-2">
		<input
			type="radio"
			name="appTheme"
			class="h-4 w-4"
			value={AppTheme.Light}
			checked={settingStore.appearance.appTheme === AppTheme.Light}
			onchange={onAppThemeChange}
		/>
		<div>Light</div>
	</label>
	<label class="grid cursor-pointer grid-cols-[min-content_auto] items-center gap-3 px-3 py-2">
		<input
			type="radio"
			name="appTheme"
			class="h-4 w-4"
			value={AppTheme.Dark}
			checked={settingStore.appearance.appTheme === AppTheme.Dark}
			onchange={onAppThemeChange}
		/>
		<div>Dark</div>
	</label>
</SettingInput>

<SettingInput>
	<p class="text-opacity-background-70 px-3 pb-2 pt-3 text-xs">Liquid Glass</p>
	<label class="grid cursor-pointer grid-cols-[min-content_auto] items-center gap-3 px-3 py-2">
		<input
			type="radio"
			name="liquidGlassMode"
			class="h-4 w-4"
			value={LiquidGlassMode.Tinted}
			checked={settingStore.appearance.liquidGlassMode === LiquidGlassMode.Tinted}
			onchange={onLiquidGlassChange}
		/>
		<div>
			<span class="font-semibold">Tinted</span> — Accent-colored glass panels (Aries default)
		</div>
	</label>
	<label class="grid cursor-pointer grid-cols-[min-content_auto] items-center gap-3 px-3 py-2">
		<input
			type="radio"
			name="liquidGlassMode"
			class="h-4 w-4"
			value={LiquidGlassMode.Transparent}
			checked={settingStore.appearance.liquidGlassMode === LiquidGlassMode.Transparent}
			onchange={onLiquidGlassChange}
		/>
		<div>
			<span class="font-semibold">Transparent</span> — Clear frosted glass without accent tint
		</div>
	</label>
</SettingInput>
