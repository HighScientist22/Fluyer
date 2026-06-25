import { AppTheme, LiquidGlassMode } from '$lib/features/settings/appearance/types';
import settingStore from '$lib/stores/setting.svelte';
import PersistentStoreService from '$lib/services/PersistentStoreService.svelte';

const ThemeService = {
	initialize: async () => {
		await Promise.all([
			PersistentStoreService.appearance.appTheme.initialize(),
			PersistentStoreService.appearance.liquidGlassMode.initialize()
		]);
		ThemeService.apply();
	},

	apply: () => {
		const root = document.documentElement;
		root.dataset.appTheme = settingStore.appearance.appTheme;
		root.dataset.liquidGlass = settingStore.appearance.liquidGlassMode;

		if (settingStore.appearance.appTheme === AppTheme.Light) {
			root.classList.add('theme-light');
			root.classList.remove('theme-dark');
		} else if (settingStore.appearance.appTheme === AppTheme.Dark) {
			root.classList.add('theme-dark');
			root.classList.remove('theme-light');
		} else {
			root.classList.remove('theme-light', 'theme-dark');
		}
	},

	setAppTheme: async (theme: AppTheme) => {
		settingStore.appearance.appTheme = theme;
		await PersistentStoreService.appearance.appTheme.set(theme);
		ThemeService.apply();
	},

	setLiquidGlassMode: async (mode: LiquidGlassMode) => {
		settingStore.appearance.liquidGlassMode = mode;
		await PersistentStoreService.appearance.liquidGlassMode.set(mode);
		ThemeService.apply();
	}
};

export default ThemeService;
