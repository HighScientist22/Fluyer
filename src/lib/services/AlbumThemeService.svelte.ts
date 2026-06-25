// @ts-ignore
import { prominent } from 'color.js';

export interface AlbumTheme {
	accent: string;
	background: [string, string];
}

const cache = new Map<string, AlbumTheme>();

const FALLBACK: AlbumTheme = {
	accent: 'rgb(99, 102, 241)',
	background: ['rgb(15, 15, 25)', 'rgb(5, 5, 12)']
};

const AlbumThemeService = {
	extractFromImage: async (imageUrl: string, cacheKey?: string): Promise<AlbumTheme> => {
		const key = cacheKey ?? imageUrl;
		if (cache.has(key)) return cache.get(key)!;

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

			const theme = extractAriesStyle(image) ?? (await extractProminent(image));
			cache.set(key, theme);
			return theme;
		} catch {
			return FALLBACK;
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

function extractAriesStyle(image: HTMLImageElement): AlbumTheme | null {
	const side = 48;
	const canvas = document.createElement('canvas');
	canvas.width = side;
	canvas.height = side;
	const ctx = canvas.getContext('2d', { willReadFrequently: true });
	if (!ctx) return null;

	ctx.drawImage(image, 0, 0, side, side);
	const { data } = ctx.getImageData(0, 0, side, side);

	const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i] / 255;
		const g = data[i + 1] / 255;
		const b = data[i + 2] / 255;
		const maxC = Math.max(r, g, b);
		const minC = Math.min(r, g, b);
		const brightness = maxC;
		const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
		if (brightness < 0.15 || (saturation < 0.12 && brightness > 0.9)) continue;

		const key = (Math.floor(r * 7) << 6) | (Math.floor(g * 7) << 3) | Math.floor(b * 7);
		const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
		bucket.count += 1;
		bucket.r += r;
		bucket.g += g;
		bucket.b += b;
		buckets.set(key, bucket);
	}

	let best: { count: number; r: number; g: number; b: number } | null = null;
	let bestScore = -1;

	for (const bucket of buckets.values()) {
		const score = bucketScore(bucket);
		if (score > bestScore) {
			bestScore = score;
			best = bucket;
		}
	}

	if (!best || best.count === 0) return null;

	const r = Math.round((best.r / best.count) * 255);
	const g = Math.round((best.g / best.count) * 255);
	const b = Math.round((best.b / best.count) * 255);
	const accent = `rgb(${r}, ${g}, ${b})`;

	return {
		accent,
		background: [blend(r, g, b, 0.35), blend(r, g, b, 0.6)]
	};
}

function bucketScore(bucket: { count: number; r: number; g: number; b: number }): number {
	const n = bucket.count;
	const r = bucket.r / n;
	const g = bucket.g / n;
	const b = bucket.b / n;
	const maxC = Math.max(r, g, b);
	const minC = Math.min(r, g, b);
	const saturation = maxC === 0 ? 0 : (maxC - minC) / maxC;
	return n * (0.4 + saturation);
}

async function extractProminent(image: HTMLImageElement): Promise<AlbumTheme> {
	// @ts-ignore
	const colors = (await prominent(image, { amount: 5 })) as number[][];
	if (!colors?.length) return FALLBACK;

	const [r, g, b] = colors[0];
	return {
		accent: `rgb(${r}, ${g}, ${b})`,
		background: [blend(r, g, b, 0.35), blend(r, g, b, 0.6)]
	};
}

function blend(r: number, g: number, b: number, amount: number): string {
	const br = Math.round(r * (1 - amount));
	const bg = Math.round(g * (1 - amount));
	const bb = Math.round(b * (1 - amount));
	return `rgb(${br}, ${bg}, ${bb})`;
}

export default AlbumThemeService;
