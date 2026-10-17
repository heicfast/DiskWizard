#!/usr/bin/env node
/**
 * Version sync — package.json ↔ tauri.conf.json ↔ Cargo.toml must all
 * agree on the app version (the release pipeline's single source of
 * truth).
 */
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const conf = JSON.parse(readFileSync("src-tauri/tauri.conf.json", "utf8"));
const cargo = readFileSync("src-tauri/Cargo.toml", "utf8");

const versions = {
  "package.json": pkg.version,
  "tauri.conf.json": conf.version,
  "Cargo.toml": cargo.match(/^version\s*=\s*"([^"]+)"/m)?.[1],
};

const values = new Set(Object.values(versions));
if (values.size !== 1) {
  console.error("::error::version mismatch:", versions);
  process.exit(1);
}
console.log("versions in sync:", versions["package.json"]);
