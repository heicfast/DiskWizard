//! Device enumeration + SMART health commands (SIMULATED bodies until
//! the core connects — the wire shapes match the browser mock exactly).

use serde_json::{json, Value};

/// The device inventory: internal disks/partitions, external/USB/SD,
/// BitLocker-locked volumes, lost partitions.
#[tauri::command]
pub async fn enumerate_devices() -> Result<Value, String> {
    // SIMULATED — core TODO: mountmgr + WMI + partition-table analysis
    // (the MOM DeviceManager surface).
    Ok(json!([]))
}

/// BitLocker unlock (password or 48-digit recovery key) — SIMULATED
/// body until the core's FVE chain lands (pipe + XTS-AES stream).
#[tauri::command]
pub async fn unlock_bitlocker(device_id: String, mode: String, secret: String) -> Result<Value, String> {
    let _ = (device_id, mode, secret);
    // SIMULATED — core TODO: DRWService FVE pipe + BitLockerLib unlock.
    Ok(json!({ "unlocked": true }))
}

/// SMART report for one disk.
#[tauri::command]
pub async fn get_disk_health(disk_id: String) -> Result<Value, String> {
    let _ = disk_id;
    // SIMULATED — core TODO: SAT/ATA passthrough + NVMe health log.
    Ok(Value::Null)
}

/// SMART reports for every physical disk.
#[tauri::command]
pub async fn get_health_reports() -> Result<Value, String> {
    // SIMULATED — core TODO: enumerate + query per disk.
    Ok(json!([]))
}
