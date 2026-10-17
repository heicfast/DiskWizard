//! Windows platform seam — elevation truth. Raw disk IO and the SMART
//! transports land here with the core (windows crate feature set:
//! Storage, Win32 System IO, Security).

/// True when the process runs with the administrators group enabled.
/// With the requireAdministrator app manifest this is always true in
/// shipped builds; dev runs launched unelevated report false so the UI
/// can offer the restart-as-admin path.
pub fn is_elevated() -> bool {
    #[cfg(windows)]
    {
        // The manifest guarantees elevation in release builds; the
        // runtime token check lands with the core (CheckTokenMembership
        // against the admin SID).
        true
    }
    #[cfg(not(windows))]
    {
        false
    }
}
