use crate::smart_playlist::{
    create, delete, get_all, resolve_preset, resolve_rule, SmartPlaylist, SmartPlaylistRule,
};

#[tauri::command]
pub fn smart_playlist_all_get() -> Result<Vec<SmartPlaylist>, String> {
    get_all()
}

#[tauri::command]
pub fn smart_playlist_create(name: String, rule: SmartPlaylistRule) -> Result<i64, String> {
    create(&name, &rule)
}

#[tauri::command]
pub fn smart_playlist_delete(id: i64) -> Result<(), String> {
    delete(id)
}

#[tauri::command]
pub fn smart_playlist_resolve_preset(preset: String, limit: usize) -> Result<Vec<String>, String> {
    resolve_preset(&preset, limit)
}

#[tauri::command]
pub fn smart_playlist_resolve_rule(
    rule: SmartPlaylistRule,
    limit: usize,
) -> Result<Vec<String>, String> {
    resolve_rule(&rule, limit)
}
