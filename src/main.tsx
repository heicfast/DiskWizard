import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "./theme/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";
import "./styles/home.css";
import "./styles/detail.css";
import "./styles/overlays.css";
import "./styles/diskhealth.css";
import { App } from "./App";
import { isTauri } from "./lib/ipc";

/**
 * Boot — in the plain-browser DEV build the mock core installs before
 * React mounts (dynamic import, DEV-gated: the mock never ships in a
 * production bundle).
 */
async function boot(): Promise<void> {
  if (!isTauri() && import.meta.env.DEV) {
    const { installMock } = await import("./mock/commands");
    installMock();
  }

  const root = document.getElementById("root");
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
}

void boot();
