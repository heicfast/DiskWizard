#!/usr/bin/env node
/**
 * Tour capture harness — the agent-browser/CI contract:
 * boots the DEV server with the mock core, drives ?tour=1, and
 * captures EXACTLY ONE named frame per tour step by polling the
 * window title for the tNN-name markers (the TourDriver stamps the
 * step marker into document.title; the harness waits for a NEW
 * marker, settles, then screenshots).
 *
 * Output: ci-artifacts/tour/tNN-name.png
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import http from "node:http";

const PORT = 1430;
const OUT = "ci-artifacts/tour";
const SETTLE_MS = 1300;
const BASE_URL = `http://localhost:${PORT}`;

mkdirSync(OUT, { recursive: true });

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function probe(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(timeoutMs = 60_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await probe(BASE_URL)) return true;
    await wait(500);
  }
  return false;
}

async function main() {
  // 1. Boot vite (DEV mode => mock core installs).
  const vite = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
    stdio: "pipe",
    shell: true,
  });
  const kill = () => {
    try {
      vite.kill("SIGTERM");
    } catch {}
  };
  process.on("SIGINT", () => {
    kill();
    process.exit(130);
  });

  if (!(await waitForServer())) {
    console.error("::error::dev server never became ready");
    kill();
    process.exit(1);
  }

  // 2. Drive the tour with playwright (present via npx).
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 860 } });
  await page.goto(`${BASE_URL}/?tour=1&license_sim=1`, { waitUntil: "networkidle" });

  const seen = new Set();
  let lastTitle = "";
  const deadline = Date.now() + 180_000;

  while (Date.now() < deadline) {
    const title = await page.title();
    if (title !== lastTitle) {
      lastTitle = title;
      const marker = title.match(/(t\d{2}-[a-z0-9-]+)/);
      if (marker && !seen.has(marker[1]) && !title.includes("tour-complete")) {
        seen.add(marker[1]);
        await wait(SETTLE_MS);
        await page.screenshot({ path: `${OUT}/${marker[1]}.png` });
        console.log("captured", marker[1]);
      }
      if (title.includes("tour-complete")) {
        writeFileSync(`${OUT}/index.json`, JSON.stringify({ steps: [...seen] }, null, 2));
        break;
      }
    }
    await wait(300);
  }

  await browser.close();
  kill();
  console.log("tour capture complete:", seen.size, "frames");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
