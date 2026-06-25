// @ts-ignore
import { prominent } from 'color.js';

export interface AlbumTheme {
	accent: string;
	background: [string, string];
}

const cache = new Map<string, AlbumTheme>();

const AlbumThemeService = {
	extractFromImage: async (imageUrl: string, cacheKey?: string): Promise<AlbumTheme> => {
		const key = cacheKey ?? imageUrl;
		if (cache.has(key)) return cache.get(key)!;

		const fallback: AlbumTheme = {
			accent: 'rgb(99, 102, 241)',
			background: ['rgb(15, 15, 25)', 'rgb(5, 5, 12)']
		};

		try {
			const image = new Image();
			image.crossOrigin = 'anonymous';
			image.src = imageUrl;

			if (!image.complete) {
				await new Promise<void>((resolve, reject) => {
					image.onload = () => resolve();
					image.onerror = () => reject();
				});
			}

			// @ts-ignore
			const colors = (await prominent(image, { amount: 5 })) as number[][];
			if (!colors?.length) return fallback;

			const [r, g, b] = colors[0];
			const accent = `rgb(${r}, ${g}, ${b})`;
			const darkTop = blend(r, g, b, 0.35);
			const darkBottom = blend(r, g, b, 0.6);
			const theme: AlbumTheme = {
				accent,
				background: [darkTop, darkBottom]
			};
			cache.set(key, theme);
			return theme;
		} catch {
			return fallback;
		}
	},

	applyToDocument: (theme: AlbumTheme) => {
		const root = document.documentElement;
		root.style.setProperty('--home-accent', theme.accent);
		root.style.setProperty('--home-bg-top', theme.background[0]);
		root.style.setProperty('--home-bg-bottom', theme.background[1]);
	},

	reset: () => {
		const root = document.documentElement;
		root.style.removeProperty('--home-accent');
		root.style.removeProperty('--home-bg-top');
		root.style.removeProperty('--home-bg-bottom');
	}
};

function blend(r: number, g: number, b: number, amount: number): string {
	const br = Math.round(r * (1 - amount));
	const bg = Math.round(g * (1 - amount));
	const bb = Math.round(b * (1 - amount));
	return `rgb(${br}, ${bg}, ${bb})`;
}

export default AlbumThemeService;
