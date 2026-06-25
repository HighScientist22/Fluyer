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

	const displayValue = $derived(
		typeof value === 'number' && value >= 10000
			? `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`
			: value
	);
</script>

<button
	class="home-stat-card group min-w-0 w-full text-left transition-transform duration-300 hover:scale-[1.02]"
	{onclick}
	disabled={!onclick}
>
	<View class="home-glass-panel h-full rounded-xl p-3 sm:p-4" glassEnableBlur>
		<div class="mb-2" style="color: {accent}">
			<div class="h-5 w-5 sm:h-6 sm:w-6">
				<Icon type={icon} />
			</div>
		</div>
		<p class="text-opacity-background-70 text-[11px] sm:text-xs">{label}</p>
		<p class="mt-0.5 truncate font-light text-xl leading-tight tracking-tight sm:text-2xl">
			{displayValue}
		</p>
	</View>
</button>
