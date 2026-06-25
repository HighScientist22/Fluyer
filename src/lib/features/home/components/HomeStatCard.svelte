<script lang="ts">
	import View from '$lib/ui/components/View.svelte';
	import Icon from '$lib/ui/icon/Icon.svelte';
	import { IconType } from '$lib/ui/icon/types';

	interface Props {
		icon: IconType;
		label: string;
		value: string | number;
		accent?: string;
		onclick?: () => void;
	}

	let { icon, label, value, accent = 'var(--home-accent, rgb(99, 102, 241))', onclick }: Props =
		$props();
</script>

<button
	class="home-stat-card group w-full text-left transition-transform duration-300 hover:scale-[1.02]"
	{onclick}
	disabled={!onclick}
>
	<View class="home-glass-panel h-full rounded-xl p-4" glassEnableBlur>
		<div class="mb-2.5" style="color: {accent}">
			<div class="h-6 w-6">
				<Icon type={icon} />
			</div>
		</div>
		<p class="text-opacity-background-70 text-xs">{label}</p>
		<p class="mt-1 font-light text-[1.75rem] leading-tight tracking-tight">{value}</p>
	</View>
</button>
