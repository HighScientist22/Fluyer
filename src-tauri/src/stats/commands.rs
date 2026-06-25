use crate::stats::{
    get_album_track_paths, get_artists, get_discover_mixes, get_favorite_paths,
    get_genre_stats, get_library_genre_stats, get_library_stats, get_recent_played,
    get_recently_added, is_favorite, record_play, toggle_favorite, ArtistSummary, FocusMix,
    GenreStat, LibraryStats, RecentAlbum,
};

#[tauri::command]
pub fn stats_record_play(path: String, duration_seconds: f64) -> Result<(), String> {
    record_play(&path, duration_seconds)
}

#[tauri::command]
pub fn stats_library_get() -> Result<LibraryStats, String> {
    get_library_stats()
}

#[tauri::command]
pub fn stats_recent_played_get(limit: usize) -> Result<Vec<RecentAlbum>, String> {
    get_recent_played(limit)
}

#[tauri::command]
pub fn stats_recently_added_get(limit: usize) -> Result<Vec<RecentAlbum>, String> {
    get_recently_added(limit)
}

#[tauri::command]
pub fn stats_genre_get(limit: usize) -> Result<Vec<GenreStat>, String> {
    get_genre_stats(limit)
}

#[tauri::command]
pub fn stats_library_genres_get(limit: usize) -> Result<Vec<GenreStat>, String> {
    get_library_genre_stats(limit)
}

#[tauri::command]
pub fn stats_album_paths_get(album: String) -> Result<Vec<String>, String> {
    get_album_track_paths(&album)
}

#[tauri::command]
pub fn stats_discover_mixes_get(max_mixes: usize) -> Result<Vec<FocusMix>, String> {
    get_discover_mixes(max_mixes)
}

#[tauri::command]
pub fn stats_artists_get(limit: usize) -> Result<Vec<ArtistSummary>, String> {
    get_artists(limit)
}

#[tauri::command]
pub fn favorites_toggle(path: String) -> Result<bool, String> {
    toggle_favorite(&path)
}

#[tauri::command]
pub fn favorites_is(path: String) -> Result<bool, String> {
    is_favorite(&path)
}

#[tauri::command]
pub fn favorites_all_get() -> Result<Vec<String>, String> {
    get_favorite_paths()
}
