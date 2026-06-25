<script lang="ts">
	import Glass from '$lib/ui/glass/Glass.svelte';
	import { isMacos } from '$lib/platform';
	import type { GlassShineSize } from '$lib/ui/glass/types';

	interface Props {
		children?: import('svelte').Snippet;
		class?: string;
		style?: string;
		thisElement?: HTMLDivElement;
		glassEnableBlur?: boolean;
		glassEnableHoverEffect?: boolean;
		glassLiquid?: boolean;
		glassShineSize?: GlassShineSize;
		events?: any;
	}

	let {
		glassEnableBlur = false,
		glassEnableHoverEffect = false,
		glassLiquid = false,
		glassShineSize = 'md',
		children,
		thisElement = $bindable<HTMLDivElement>(),
		...props
	}: Props = $props();

	const useLiquidGlass = $derived(glassLiquid || (isMacos() && glassEnableBlur));
</script>

<Glass
	class="{!useLiquidGlass && 'bg-gray-300/10'} {glassEnableHoverEffect &&
		!useLiquidGlass &&
		'hover:bg-gray-200/20'} {props.class}"
	style={props.style}
	enableBlur={glassEnableBlur}
	liquidGlass={useLiquidGlass}
	interactive={glassEnableHoverEffect && useLiquidGlass}
	shineSize={glassShineSize}
	bind:thisElement
	events={props.events}
>
	{@render children?.()}
</Glass>
