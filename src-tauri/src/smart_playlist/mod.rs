pub mod commands;

use crate::database::database::GLOBAL_DATABASE;
use crate::folder::database::get_tracks;
use crate::music::metadata::MusicMetadata;
use crate::stats::{get_favorite_paths, get_played_paths};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SmartCriterion {
    pub field: String,
    #[serde(rename = "match")]
    pub match_type: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SmartPlaylistRule {
    pub match_all: bool,
    pub criteria: Vec<SmartCriterion>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SmartPlaylist {
    pub id: i64,
    pub name: String,
    pub match_all: bool,
    pub rules: SmartPlaylistRule,
}

pub fn get_all() -> Result<Vec<SmartPlaylist>, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn
        .prepare("SELECT id, name, match_all, rules_json FROM smart_playlists ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;

    let playlists = stmt
        .query_map([], |row| {
            let rules_json: String = row.get(3)?;
            let rules: SmartPlaylistRule =
                serde_json::from_str(&rules_json).map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
            Ok(SmartPlaylist {
                id: row.get(0)?,
                name: row.get(1)?,
                match_all: row.get::<_, i64>(2)? != 0,
                rules,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(playlists)
}

pub fn create(name: &str, rule: &SmartPlaylistRule) -> Result<i64, String> {
    let rules_json = serde_json::to_string(rule).map_err(|e| e.to_string())?;
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "INSERT INTO smart_playlists (name, match_all, rules_json) VALUES (?1, ?2, ?3)",
        params![name, rule.match_all as i64, rules_json],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

pub fn delete(id: i64) -> Result<(), String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    conn.execute("DELETE FROM smart_playlists WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn resolve_preset(preset: &str, limit: usize) -> Result<Vec<String>, String> {
    match preset {
        "favorites" => Ok(get_favorite_paths()?),
        "recently-played" => get_recently_played_paths(limit),
        "most-played" => get_most_played_paths(limit),
        "unheard" => get_unheard_paths(limit),
        other => Err(format!("Unknown preset: {other}")),
    }
}

pub fn resolve_rule(rule: &SmartPlaylistRule, limit: usize) -> Result<Vec<String>, String> {
    let tracks = get_tracks();
    let favorites: HashSet<String> = get_favorite_paths()?.into_iter().collect();
    let play_counts = get_play_counts_map()?;
    let played = get_played_paths()?;

    let mut paths: Vec<String> = tracks
        .into_iter()
        .filter(|track| track_matches(track, rule, &favorites, &play_counts, &played))
        .map(|t| t.path)
        .collect();

    paths.truncate(limit);
    Ok(paths)
}

fn track_matches(
    track: &MusicMetadata,
    rule: &SmartPlaylistRule,
    favorites: &HashSet<String>,
    play_counts: &HashMap<String, usize>,
    played: &HashSet<String>,
) -> bool {
    if rule.criteria.is_empty() {
        return true;
    }

    let results: Vec<bool> = rule
        .criteria
        .iter()
        .map(|c| criterion_matches(track, c, favorites, play_counts, played))
        .collect();

    if rule.match_all {
        results.iter().all(|&r| r)
    } else {
        results.iter().any(|&r| r)
    }
}

fn criterion_matches(
    track: &MusicMetadata,
    criterion: &SmartCriterion,
    favorites: &HashSet<String>,
    play_counts: &HashMap<String, usize>,
    played: &HashSet<String>,
) -> bool {
    let field_value = match criterion.field.as_str() {
        "title" => track.title.as_deref().unwrap_or("").to_lowercase(),
        "artist" => track.artist.as_deref().unwrap_or("").to_lowercase(),
        "album" => track.album.as_deref().unwrap_or("").to_lowercase(),
        "genre" => track.genre.as_deref().unwrap_or("").to_lowercase(),
        "year" => track
            .date
            .as_deref()
            .unwrap_or("")
            .chars()
            .take(4)
            .collect::<String>(),
        "favorite" => {
            let is_fav = favorites.contains(&track.path);
            return match criterion.value.as_str() {
                "true" => is_fav,
                "false" => !is_fav,
                _ => is_fav,
            };
        }
        "played" => {
            let was_played = played.contains(&track.path);
            return match criterion.value.as_str() {
                "true" => was_played,
                "false" => !was_played,
                _ => was_played,
            };
        }
        "play_count" => play_counts.get(&track.path).copied().unwrap_or(0).to_string(),
        _ => String::new(),
    };

    let needle = criterion.value.to_lowercase();

    match criterion.match_type.as_str() {
        "contains" => field_value.contains(&needle),
        "equals" => field_value == needle,
        "starts_with" => field_value.starts_with(&needle),
        "greater_than" => {
            if let (Ok(a), Ok(b)) = (field_value.parse::<f64>(), needle.parse::<f64>()) {
                a > b
            } else {
                false
            }
        }
        _ => field_value.contains(&needle),
    }
}

fn get_play_counts_map() -> Result<HashMap<String, usize>, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn
        .prepare("SELECT path, COUNT(*) FROM play_history GROUP BY path")
        .map_err(|e| e.to_string())?;
    let map = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)? as usize)))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(map)
}

fn get_recently_played_paths(limit: usize) -> Result<Vec<String>, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn
        .prepare(
            "SELECT path FROM play_history ORDER BY played_at DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

    let mut seen = HashSet::new();
    let mut paths = Vec::new();
    for row in stmt
        .query_map(params![(limit * 3) as i64], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .flatten()
    {
        if seen.insert(row.clone()) {
            paths.push(row);
            if paths.len() >= limit {
                break;
            }
        }
    }
    Ok(paths)
}

fn get_most_played_paths(limit: usize) -> Result<Vec<String>, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn
        .prepare(
            "SELECT path FROM play_history GROUP BY path ORDER BY COUNT(*) DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;
    let paths = stmt
        .query_map(params![limit as i64], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(paths)
}

fn get_unheard_paths(limit: usize) -> Result<Vec<String>, String> {
    let played = get_played_paths()?;
    let tracks = get_tracks();
    let paths: Vec<String> = tracks
        .into_iter()
        .filter(|t| !played.contains(&t.path))
        .map(|t| t.path)
        .take(limit)
        .collect();
    Ok(paths)
}
