//! DiskWizard — Tauri 2 shell.
//!
//! The UI is complete and production-ready; the Rust core is being
//! built separately. This shell provides the window contract (frameless
//! + maximized + pre-painted background, shown after sizing), the
//! elevation surface, and the command handlers the frontend invokes.
//! Commands marked SIMULATED return the same wire shapes the browser
//! mock core produces — the core will replace the bodies without any
//! frontend change (the single-IPC-seam contract).
//!
//! Layout (mirrors the planned core crates):
//!   commands/  the invoke surface (app, elevation, devices, scan,
//!              results, recovery, license)
//!   platform/  OS seams (win first; mac later)

use tauri::Manager;

mod commands;
mod platform;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // App
            commands::app::get_app_version,
            commands::app::get_dev_hooks,
            commands::app::check_updates,
            // Elevation
            commands::app::is_elevated,
            commands::app::restart_as_admin,
            // Devices + health
            commands::devices::unlock_bitlocker,
            commands::devices::enumerate_devices,
            commands::devices::get_disk_health,
            commands::devices::get_health_reports,
            // Scan lifecycle
            commands::scan::start_scan,
            commands::scan::pause_scan,
            commands::scan::resume_scan,
            commands::scan::stop_scan,
            commands::scan::get_scan_progress,
            // Results
            commands::results::get_tree_roots,
            commands::results::get_tree_reveal,
            commands::results::list_children,
            commands::results::list_type_files,
            commands::results::get_node,
            commands::results::preview_file,
            // Recovery
            commands::recovery::recover_files,
            commands::recovery::cancel_recovery,
            commands::recovery::select_folder,
            commands::recovery::list_destinations,
            // Sessions
            commands::recovery::list_scan_sessions,
            commands::recovery::import_scan_session,
            // License
            commands::license::license_state,
            commands::license::activate_license,
            commands::license::validate_license,
            commands::license::deactivate_license,
            commands::license::license_sim_set,
        ])
        .setup(|app| {
            // Show discipline: the window is created hidden; size it to
            // the work area, center, then reveal — no resize flash
            // (DiskGenie contract).
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.set_focus();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running DiskWizard");
}
