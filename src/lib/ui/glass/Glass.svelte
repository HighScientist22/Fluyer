<script lang="ts">
	import { isAndroid, isMacos } from '$lib/platform';
	import type { GlassShineSize } from '$lib/ui/glass/types';

	interface Props {
		children?: import('svelte').Snippet;
		class?: string;
		style?: string;
		showShine?: boolean;
		shineColor?: string;
		showShadow?: boolean;
		enableBlur?: boolean;
		liquidGlass?: boolean;
		interactive?: boolean;
		thisElement?: HTMLDivElement;
		shineSize?: GlassShineSize;
		events?: any;
	}

	let {
		children,
		shineColor = 'rgba(255, 255, 255, 0.5)',
		enableBlur = false,
		liquidGlass = false,
		interactive = false,
		shineSize = 'md',
		thisElement = $bindable<HTMLDivElement>(),
		...props
	}: Props = $props();

	const getBlurClass = () => {
		if (liquidGlass || enableBlur) {
			return isAndroid() ? 'backdrop-blur-xs' : '';
		}
		if (!enableBlur) return '';
		return isAndroid() ? 'backdrop-blur-xs' : 'backdrop-blur-md';
	};

	const getGlassClass = () => {
		if (!liquidGlass && !isMacos()) return 'bg-gray-300/10';
		if (liquidGlass && interactive) return 'liquid-glass-interactive';
		if (liquidGlass) return 'liquid-glass';
		return '';
	};

	const getHoverClasses = () => {
		if (liquidGlass) return '';
		return 'transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,2.2)]';
	};

	const getShineSize = () => {
		if (liquidGlass) return '';
		if (shineSize === 'sm') return 'border-[1.5px] border-[var(--shine-color)]';
		return 'border-[2px] border-[var(--shine-color)]';
	};
</script>

<div
	class="{getBlurClass()} {getGlassClass()} {getHoverClasses()}
        {getShineSize()}
        {props.class ?? ''}"
	style="--shine-color: {shineColor}; {isAndroid()
		? '-webkit-transform: translate3d(0, 0, 0);'
		: ''} {props.style || ''}"
	bind:this={thisElement}
	{...props.events}
>
	{@render children?.()}
</div>
