//! Results tree + preview commands (SIMULATED bodies until the core
//! connects — three-branch tree, lazy children, preview subsystem).

use serde_json::{json, Value};

#[tauri::command]
pub async fn get_tree_roots() -> Result<Value, String> {
    // SIMULATED — core TODO: volume root / File Path Lost / Reconstructed.
    Ok(json!([]))
}

#[tauri::command]
pub async fn get_tree_reveal() -> Result<Value, String> {
    Ok(json!({ "roots": [], "nodes": [] }))
}

#[tauri::command]
pub async fn list_children(parent_id: Option<String>) -> Result<Value, String> {
    let _ = parent_id;
    Ok(json!([]))
}

#[tauri::command]
pub async fn get_node(node_id: String) -> Result<Value, String> {
    Err(format!("NODE_NOT_FOUND. {node_id}"))
}

#[tauri::command]
pub async fn preview_file(file_id: String) -> Result<Value, String> {
    let _ = file_id;
    // SIMULATED — core TODO: the IPreviewStub plugin family.
    Ok(json!({ "previewable": false, "placeholder": "generic" }))
}
