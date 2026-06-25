import { SettingAnimatedBackgroundType } from '$lib/features/settings/animated_background/types';
import { AppTheme, LiquidGlassMode } from '$lib/features/settings/appearance/types';

const settingStore = $state({
	animatedBackground: {
		trigger: '',
		type: SettingAnimatedBackgroundType.Pallete
	},

	appearance: {
		appTheme: AppTheme.Dark,
		liquidGlassMode: LiquidGlassMode.Tinted
	},

	ui: {
		showRepeatButton: true,
		showShuffleButton: true,
		play: {
			showBackButton: true,
			showVolume: true
		}
	},

	developerMode: false,
	bitPerfectMode: false
});

export default settingStore;
