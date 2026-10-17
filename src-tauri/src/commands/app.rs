//! App-level commands: version, dev hooks, update check, elevation.

use serde::Serialize;

#[derive(Serialize)]
pub struct UpdateCheck {
    pub current: String,
    pub latest: String,
    pub up_to_date: bool,
}

#[tauri::command]
pub fn get_app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

/// DEV hooks (CI screenshot harness): DISKWIZARD_TOUR=1, SCAN, WINDOW.
/// Reads process env once — no effect on release behaviour.
#[tauri::command]
pub fn get_dev_hooks() -> serde_json::Value {
    let tour = std::env::var("DISKWIZARD_TOUR").ok().as_deref() == Some("1");
    let license_sim = std::env::var("DISKWIZARD_LICENSE_SIM").ok().as_deref() == Some("1");
    let scan = std::env::var("DISKWIZARD_SCAN").ok();
    let window = std::env::var("DISKWIZARD_WINDOW").ok();
    serde_json::json!({ "tour": tour, "licenseSim": license_sim, "scanTarget": scan, "window": window })
}

/// Update check (network layer lands with the core).
#[tauri::command]
pub async fn check_updates() -> Result<UpdateCheck, String> {
    // SIMULATED — core TODO: check-version protocol.
    Ok(UpdateCheck {
        current: env!("CARGO_PKG_VERSION").into(),
        latest: env!("CARGO_PKG_VERSION").into(),
        up_to_date: true,
    })
}

/// True when the process token carries the administrators group. The
/// exe manifest already requires elevation at launch, so this is
/// expected to be true; the command exists so the UI can render the
/// accurate state in hardening scenarios (e.g. developer launches the
/// binary directly).
#[tauri::command]
pub fn is_elevated() -> bool {
    crate::platform::win::is_elevated()
}

/// Re-launch elevated with the same args. With the requireAdministrator
/// manifest this only fires in unelevated dev runs; production builds
/// are elevated from the start.
#[tauri::command]
pub async fn restart_as_admin(_app: tauri::AppHandle) -> Result<bool, String> {
    // SIMULATED — core TODO: ShellExecuteW "runas" + exit(0).
    Ok(true)
}
