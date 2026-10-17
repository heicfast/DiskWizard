//! Recovery funnel commands (SIMULATED bodies until the core connects).

use serde_json::{json, Value};

#[tauri::command]
pub async fn recover_files(file_ids: Vec<String>, destination: String) -> Result<Value, String> {
    // SIMULATED — core TODO: CRecoveryMgr export loop with progress
    // events, destination validation (same-volume block, space gate),
    // and the license ladder check.
    let _ = destination;
    Ok(json!({ "jobId": "job-0", "filesTotal": file_ids.len(), "destPath": destination }))
}

#[tauri::command]
pub async fn cancel_recovery() -> Result<Value, String> {
    Ok(json!({ "ok": true }))
}

#[tauri::command]
pub async fn select_folder(_app: tauri::AppHandle) -> Result<String, String> {
    // SIMULATED — core TODO: native folder picker via the dialog plugin.
    Ok("D:\\Recovered Files".into())
}

#[tauri::command]
pub async fn list_destinations() -> Result<Value, String> {
    Ok(json!([]))
}

#[tauri::command]
pub async fn list_scan_sessions() -> Result<Value, String> {
    // SIMULATED — core TODO: .rsf session index (SaveScan directory).
    Ok(json!([]))
}

#[tauri::command]
pub async fn import_scan_session(session_id: String) -> Result<Value, String> {
    Ok(json!({ "imported": true, "sessionId": session_id }))
}
