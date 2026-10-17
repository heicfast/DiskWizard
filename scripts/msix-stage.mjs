#!/usr/bin/env node
/**
 * MSIX staging — assembles the package layout (exe + generated logo
 * assets + substituted manifest) for MakeAppx. The Partner Center
 * signs on ingest; this job only packs.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const EXE = resolve("src-tauri/target/release/diskwizard.exe");
const LAYOUT = resolve("msix-layout");
const ICON_SRC = resolve("src-tauri/icons/icon.png");
const BRAND_BG = "#1552D5"; // Royal Blue tile (brand kit)

if (!existsSync(EXE)) {
  console.error("::error::release exe missing:", EXE);
  process.exit(1);
}

mkdirSync(LAYOUT, { recursive: true });
copyFileSync(EXE, resolve(LAYOUT, "diskwizard.exe"));

// Logo fan-out: scale assets + Store tiles, letterboxed on the brand tile.
mkdirSync(resolve(LAYOUT, "Assets"), { recursive: true });
for (const px of [44, 48, 71, 88, 150, 310, 620]) {
  const name = `Square${px}x${px}Logo`;
  const out = resolve(LAYOUT, `Assets/${name}.png`).replace(/\\/g, "/");
  const src = ICON_SRC.replace(/\\/g, "/");
  execSync(
    `powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing;` +
      `$src=[System.Drawing.Image]::FromFile('${src}');` +
      `$canvas=New-Object System.Drawing.Bitmap ${px},${px};` +
      `$g=[System.Drawing.Graphics]::FromImage($canvas);` +
      `$g.Clear([System.Drawing.ColorTranslator]::FromHtml('${BRAND_BG}'));` +
      `$side=[Math]::Min(${px},${px})*0.8;` +
      `$g.DrawImage($src, ((${px}-$side)/2), ((${px}-$side)/2), $side, $side);` +
      `$g.Dispose();` +
      `$canvas.Save('${out}', [System.Drawing.Imaging.ImageFormat]::Png)"`,
    { stdio: "inherit" },
  );
}

// Manifest substitution.
let manifest = readFileSync("packaging/msix/AppxManifest.xml", "utf8");
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
manifest = manifest
  .replace(/__IDENTITY_NAME__/g, "DiskWizard")
  .replace(/__PUBLISHER__/g, "CN=DiskWizard")
  .replace(/__VERSION__/g, `${version}.0`);
writeFileSync(resolve(LAYOUT, "AppxManifest.xml"), manifest);

for (const f of ["diskwizard.exe", "AppxManifest.xml"]) {
  if (!existsSync(resolve(LAYOUT, f))) {
    console.error("::error::layout incomplete:", f);
    process.exit(1);
  }
}

console.log("msix layout staged:", LAYOUT);
