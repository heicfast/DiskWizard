//! License commands — the posture machine (DiskGenie architecture
//! adapted to the DW- key prefix).
//!
//! L0–L5 (rate limits, TLS, HMAC, server entitlement, Ed25519 token,
//! device binding) land with the license worker; the shells here own
//! the client-side contract: state shape, activation flow, and the
//! hard ACTIVATION_REQUIRED / LICENSE_STALE gate markers the frontend
//! intercepts on every refused command.

use serde_json::{json, Value};

#[tauri::command]
pub async fn license_state() -> Result<Value, String> {
    // SIMULATED — core TODO: the persisted posture (DPAPI-wrapped).
    Ok(json!({ "posture": "unlicensed", "tier": "trial", "simulated": false, "trialRecoveredBytes": 0 }))
}

#[tauri::command]
pub async fn activate_license(key: String) -> Result<Value, String> {
    // SIMULATED — core TODO: normalize + online activation + token verify.
    let _ = key;
    Err("ACTIVATION_FAILED. License code not found. Check the code and try again.".into())
}

#[tauri::command]
pub async fn validate_license() -> Result<Value, String> {
    Ok(json!({ "posture": "unlicensed", "tier": "trial", "simulated": false, "trialRecoveredBytes": 0 }))
}

#[tauri::command]
pub async fn deactivate_license() -> Result<Value, String> {
    Ok(json!({ "posture": "unlicensed", "tier": "trial", "simulated": false, "trialRecoveredBytes": 0 }))
}

/// CI/agent posture flip. Production builds compile a hard refusal —
/// the `ci-license-sim` cargo feature is NEVER enabled in NSIS/MSIX
/// release builds (the DiskGenie contract).
#[tauri::command]
pub async fn license_sim_set(posture: String) -> Result<Value, String> {
    #[cfg(feature = "ci-license-sim")]
    {
        let pro = posture == "pro";
        return Ok(if pro {
            json!({ "posture": "pro", "tier": "lifetime", "name": "Alex Morgan", "email": "alex@diskwizard.app", "activatedAt": 0, "simulated": true, "trialRecoveredBytes": 0 })
        } else {
            json!({ "posture": "unlicensed", "tier": "trial", "simulated": true, "trialRecoveredBytes": 0 })
        });
    }
    #[cfg(not(feature = "ci-license-sim"))]
    {
        let _ = posture;
        Err("LICENSE_SIM_REFUSED. The simulation hook is disabled in production builds.".into())
    }
}
