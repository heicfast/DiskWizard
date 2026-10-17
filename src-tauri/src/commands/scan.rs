//! Scan lifecycle commands (SIMULATED bodies until the core connects).
//!
//! The real engine: quick pass (per-FS: MFT/FAT-chain/inode/catalog
//! walks via the plugin DLL factory) then the advanced pass
//! (sector-by-sector carving with 190+ format analysers), streaming
//! `scan-progress` events with the same ScanProgress wire shape.

use serde_json::{json, Value};

#[tauri::command]
pub async fn start_scan(device_id: String) -> Result<Value, String> {
    // SIMULATED — core TODO: engine factory + progress event stream.
    Ok(json!({ "scanId": format!("scan-{device_id}") }))
}

#[tauri::command]
pub async fn pause_scan() -> Result<Value, String> {
    Ok(json!({ "ok": true }))
}

#[tauri::command]
pub async fn resume_scan() -> Result<Value, String> {
    Ok(json!({ "ok": true }))
}

#[tauri::command]
pub async fn stop_scan() -> Result<Value, String> {
    Ok(json!({ "ok": true }))
}

#[tauri::command]
pub async fn get_scan_progress() -> Result<Value, String> {
    Ok(Value::Null)
}
