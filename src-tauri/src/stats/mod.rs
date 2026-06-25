pub mod commands;

use crate::database::database::GLOBAL_DATABASE;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PlayHistoryEntry {
    pub path: String,
    pub played_at: String,
    pub duration_seconds: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LibraryStats {
    pub artist_count: usize,
    pub album_count: usize,
    pub track_count: usize,
    pub total_listen_seconds: f64,
    pub total_library_seconds: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct GenreStat {
    pub genre: String,
    pub play_count: usize,
    pub listen_seconds: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RecentAlbum {
    pub album: String,
    pub artist: String,
    pub path: String,
    pub played_at: Option<String>,
    pub badge: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ArtistSummary {
    pub name: String,
    pub album_count: usize,
    pub track_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FocusMix {
    pub id: String,
    pub title: String,
    pub subtitle: String,
    pub paths: Vec<String>,
    pub artwork_path: Option<String>,
    pub prefers_shuffle: bool,
}

fn normalize_genre_key(genre: &str) -> String {
    genre
        .to_lowercase()
        .replace(['&', '/'], " ")
        .replace(['-', '_'], " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn primary_genre(raw: &str) -> Option<String> {
    let genre = raw.split(&[',', ';', '/'][..]).next()?.trim();
    if genre.is_empty() {
        None
    } else {
        Some(genre.to_string())
    }
}

pub fn get_library_genre_stats(limit: usize) -> Result<Vec<GenreStat>, String> {
    let tracks = crate::folder::database::get_tracks();
    let mut map: HashMap<String, (String, usize)> = HashMap::new();

    for track in tracks {
        let raw = match track.genre.as_deref().filter(|g| !g.is_empty()) {
            Some(g) => g,
            None => continue,
        };
        let display = match primary_genre(raw) {
            Some(d) => d,
            None => continue,
        };
        let key = normalize_genre_key(&display);
        let entry = map.entry(key).or_insert((display, 0));
        entry.1 += 1;
    }

    let mut stats: Vec<GenreStat> = map
        .into_values()
        .map(|(genre, count)| GenreStat {
            genre,
            play_count: count,
            listen_seconds: 0.0,
        })
        .collect();

    stats.sort_by(|a, b| b.play_count.cmp(&a.play_count));
    stats.truncate(limit);
    Ok(stats)
}

pub fn get_album_track_paths(album: &str) -> Result<Vec<String>, String> {
    let album_lower = album.to_lowercase();
    Ok(crate::folder::database::get_tracks()
        .into_iter()
        .filter(|track| {
            track
                .album
                .as_ref()
                .map(|name| name.to_lowercase() == album_lower)
                .unwrap_or(false)
        })
        .map(|track| track.path)
        .collect())
}

pub fn get_discover_mixes(max_mixes: usize) -> Result<Vec<FocusMix>, String> {
    let played = get_played_paths()?;
    let tracks = crate::folder::database::get_tracks();
    let mut genre_map: HashMap<String, (String, Vec<String>)> = HashMap::new();

    for track in tracks {
        let raw = match track.genre.as_deref().filter(|g| !g.is_empty()) {
            Some(g) => g,
            None => continue,
        };
        let display = match primary_genre(raw) {
            Some(d) => d,
            None => continue,
        };
        let key = normalize_genre_key(&display);
        genre_map
            .entry(key)
            .or_insert_with(|| (display, Vec::new()))
            .1
            .push(track.path);
    }

    let mut candidates: Vec<(String, String, Vec<String>)> = genre_map
        .into_iter()
        .map(|(key, (display, paths))| {
            let unheard: Vec<String> = paths
                .into_iter()
                .filter(|path| !played.contains(path))
                .collect();
            (key, display, unheard)
        })
        .filter(|(_, _, unheard)| unheard.len() >= 8)
        .collect();

    candidates.sort_by(|a, b| b.2.len().cmp(&a.2.len()));

    let mut mixes = Vec::new();
    let mut seen = HashSet::new();

    for (key, display, unheard) in candidates {
        if !seen.insert(key) {
            continue;
        }
        mixes.push(FocusMix {
            id: format!("unheard-{}", key.replace(' ', "-")),
            title: format!("Discover {}", display),
            subtitle: format!("{} unheard tracks", unheard.len()),
            artwork_path: unheard.first().cloned(),
            paths: unheard.into_iter().take(30).collect(),
            prefers_shuffle: true,
        });
        if mixes.len() >= max_mixes {
            break;
        }
    }

    Ok(mixes)
}

pub fn record_play(path: &str, duration_seconds: f64) -> Result<(), String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    conn.execute(
        "INSERT INTO play_history (path, played_at, duration_seconds) VALUES (?1, datetime('now'), ?2)",
        params![path, duration_seconds],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_library_stats() -> Result<LibraryStats, String> {
    let tracks = crate::folder::database::get_tracks();
    let mut artists = HashSet::new();
    let mut albums = HashSet::new();
    let mut total_library_seconds = 0.0;

    for track in &tracks {
        if let Some(artist) = track.artist.as_deref().filter(|a| !a.is_empty()) {
            artists.insert(artist.to_lowercase());
        }
        if let Some(album) = track.album.as_deref().filter(|a| !a.is_empty()) {
            albums.insert(format!(
                "{}::{}",
                album.to_lowercase(),
                track
                    .album_artist
                    .as_deref()
                    .or(track.artist.as_deref())
                    .unwrap_or("")
                    .to_lowercase()
            ));
        }
        total_library_seconds += track.duration.unwrap_or(0) as f64 / 1000.0;
    }

    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    let total_listen_seconds: f64 = conn
        .query_row(
            "SELECT COALESCE(SUM(duration_seconds), 0) FROM play_history",
            [],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    Ok(LibraryStats {
        artist_count: artists.len(),
        album_count: albums.len(),
        track_count: tracks.len(),
        total_listen_seconds,
        total_library_seconds,
    })
}

pub fn get_recent_played(limit: usize) -> Result<Vec<RecentAlbum>, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn
        .prepare(
            "SELECT ph.path, ph.played_at, m.album, m.artist, m.album_artist
             FROM play_history ph
             JOIN musics m ON m.path = ph.path
             ORDER BY ph.played_at DESC
             LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![(limit * 3) as i64], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut seen = HashSet::new();
    let mut results = Vec::new();

    for row in rows.flatten() {
        let (path, played_at, album, artist, album_artist) = row;
        let album_name = album.unwrap_or_else(|| "Unknown Album".to_string());
        let key = format!(
            "{}::{}",
            album_name.to_lowercase(),
            album_artist
                .as_deref()
                .or(artist.as_deref())
                .unwrap_or("")
                .to_lowercase()
        );
        if !seen.insert(key) {
            continue;
        }
        results.push(RecentAlbum {
            album: album_name,
            artist: album_artist
                .or(artist)
                .unwrap_or_else(|| "Unknown Artist".to_string()),
            path,
            played_at: Some(played_at),
            badge: None,
        });
        if results.len() >= limit {
            break;
        }
    }

    Ok(results)
}

pub fn get_recently_added(limit: usize) -> Result<Vec<RecentAlbum>, String> {
    let tracks = crate::folder::database::get_tracks();
    let mut album_map: HashMap<String, RecentAlbum> = HashMap::new();

    for track in tracks {
        let album = match track.album.as_deref().filter(|a| !a.is_empty()) {
            Some(a) => a.to_string(),
            None => continue,
        };
        let artist = track
            .album_artist
            .clone()
            .or(track.artist.clone())
            .unwrap_or_else(|| "Unknown Artist".to_string());
        let key = format!("{}::{}", album.to_lowercase(), artist.to_lowercase());
        album_map.entry(key).or_insert(RecentAlbum {
            album,
            artist,
            path: track.path.clone(),
            played_at: None,
            badge: Some("New".to_string()),
        });
    }

    let mut albums: Vec<_> = album_map.into_values().collect();
    albums.truncate(limit);
    Ok(albums)
}

pub fn get_genre_stats(limit: usize) -> Result<Vec<GenreStat>, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;

    let mut stmt = conn
        .prepare(
            "SELECT COALESCE(m.genre, 'Unknown'), COUNT(*), COALESCE(SUM(ph.duration_seconds), 0)
             FROM play_history ph
             JOIN musics m ON m.path = ph.path
             GROUP BY COALESCE(m.genre, 'Unknown')
             ORDER BY COUNT(*) DESC
             LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

    let stats = stmt
        .query_map(params![limit as i64], |row| {
            Ok(GenreStat {
                genre: row.get(0)?,
                play_count: row.get::<_, i64>(1)? as usize,
                listen_seconds: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(stats)
}

pub fn get_artists(limit: usize) -> Result<Vec<ArtistSummary>, String> {
    let tracks = crate::folder::database::get_tracks();
    let mut map: HashMap<String, (HashSet<String>, usize)> = HashMap::new();

    for track in &tracks {
        let artist = match track.artist.as_deref().filter(|a| !a.is_empty()) {
            Some(a) => a.to_string(),
            None => continue,
        };
        let entry = map.entry(artist.clone()).or_default();
        if let Some(album) = track.album.as_deref().filter(|a| !a.is_empty()) {
            entry.0.insert(album.to_string());
        }
        entry.1 += 1;
    }

    let mut artists: Vec<ArtistSummary> = map
        .into_iter()
        .map(|(name, (albums, track_count))| ArtistSummary {
            name,
            album_count: albums.len(),
            track_count,
        })
        .collect();

    artists.sort_by(|a, b| b.track_count.cmp(&a.track_count));
    artists.truncate(limit);
    Ok(artists)
}

pub fn get_played_paths() -> Result<HashSet<String>, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn
        .prepare("SELECT DISTINCT path FROM play_history")
        .map_err(|e| e.to_string())?;
    let paths = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(paths)
}

pub fn toggle_favorite(path: &str) -> Result<bool, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) > 0 FROM favorites WHERE path = ?1",
            params![path],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    if exists {
        conn.execute("DELETE FROM favorites WHERE path = ?1", params![path])
            .map_err(|e| e.to_string())?;
        Ok(false)
    } else {
        conn.execute(
            "INSERT INTO favorites (path, created_at) VALUES (?1, datetime('now'))",
            params![path],
        )
        .map_err(|e| e.to_string())?;
        Ok(true)
    }
}

pub fn is_favorite(path: &str) -> Result<bool, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    conn.query_row(
        "SELECT COUNT(*) > 0 FROM favorites WHERE path = ?1",
        params![path],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())
}

pub fn get_favorite_paths() -> Result<Vec<String>, String> {
    let db = GLOBAL_DATABASE.lock().map_err(|e| e.to_string())?;
    let conn = db.as_ref().ok_or("Database not initialized")?;
    let mut stmt = conn
        .prepare("SELECT path FROM favorites ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let paths = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();
    Ok(paths)
}
