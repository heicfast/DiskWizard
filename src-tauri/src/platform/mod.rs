//! Platform seams. `win` holds the Windows-specific truth (elevation,
//! raw disk access); everything stays behind neutral functions so the
//! macOS port reuses the same command bodies.

pub mod win;
