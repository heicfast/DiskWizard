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
