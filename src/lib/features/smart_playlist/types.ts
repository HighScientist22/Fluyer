export type SmartCriterionField =
	| 'title'
	| 'artist'
	| 'album'
	| 'genre'
	| 'year'
	| 'favorite'
	| 'played'
	| 'play_count';

export type SmartCriterionMatch = 'contains' | 'equals' | 'starts_with' | 'greater_than';

export interface SmartCriterion {
	field: SmartCriterionField;
	match: SmartCriterionMatch;
	value: string;
}

export interface SmartPlaylistRule {
	matchAll: boolean;
	criteria: SmartCriterion[];
}

export interface SmartPlaylistData {
	id: number;
	name: string;
	matchAll: boolean;
	rules: SmartPlaylistRule;
}

export type SmartPlaylistPreset = 'favorites' | 'recently-played' | 'most-played' | 'unheard';

export const SMART_PLAYLIST_PRESETS: {
	preset: SmartPlaylistPreset;
	name: string;
	subtitle: string;
}[] = [
	{ preset: 'favorites', name: 'Favorites', subtitle: 'Tracks you love' },
	{ preset: 'recently-played', name: 'Recently Played', subtitle: 'Your listening history' },
	{ preset: 'most-played', name: 'Most Played', subtitle: 'Your top tracks' },
	{ preset: 'unheard', name: 'Discover', subtitle: 'Tracks you haven\'t played yet' }
];

export const SMART_CRITERION_FIELDS: { value: SmartCriterionField; label: string; boolean?: boolean }[] =
	[
		{ value: 'title', label: 'Title' },
		{ value: 'artist', label: 'Artist' },
		{ value: 'album', label: 'Album' },
		{ value: 'genre', label: 'Genre' },
		{ value: 'year', label: 'Year' },
		{ value: 'favorite', label: 'Favorite', boolean: true },
		{ value: 'played', label: 'Played Before', boolean: true },
		{ value: 'play_count', label: 'Play Count' }
	];

export const SMART_CRITERION_MATCHES: { value: SmartCriterionMatch; label: string }[] = [
	{ value: 'contains', label: 'contains' },
	{ value: 'equals', label: 'equals' },
	{ value: 'starts_with', label: 'starts with' },
	{ value: 'greater_than', label: 'greater than' }
];
