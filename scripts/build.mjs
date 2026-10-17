#!/usr/bin/env node
/**
 * Build + audit for a zero-dependency static site.
 *
 * Checks:
 *   1. every locally referenced asset exists
 *   2. every in-page anchor resolves to an element
 *   3. CSS braces balance and every var(--token) is declared
 *   4. every script parses (node --check)
 *   5. copy is free of emoji and AI-filler phrasing (taste audit)
 *
 * Then copies the site into dist/ for deployment.
 *
 * Usage:  node scripts/build.mjs [--strict]
 */

import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

const errors = [];
const warnings = [];
const notes = [];

const fail = (msg) => (strict ? errors : warnings).push(msg);

/* ------------------------------------------------------------------ read */

const read = (p) => readFileSync(join(root, p), "utf8");

const html = read("index.html");
const cssFiles = ["assets/css/tokens.css", "assets/css/main.css"];
const jsFiles = ["assets/js/theme.js", "assets/js/motion.js", "assets/js/terminal.js"];

for (const file of [...cssFiles, ...jsFiles, "index.html"]) {
  try {
    read(file);
    notes.push(`read ${file}`);
  } catch {
    errors.push(`missing source file: ${file}`);
  }
}

/* -------------------------------------------------------------- assets */

const assetPaths = new Set();
for (const match of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
  const value = match[1];
  if (/^(https?:|mailto:|data:|#)/.test(value)) continue;
  assetPaths.add(value);
}

for (const asset of assetPaths) {
  try {
    statSync(join(root, asset));
    notes.push(`asset ok: ${asset}`);
  } catch {
    errors.push(`asset referenced but not found: ${asset}`);
  }
}

/* -------------------------------------------------------------- anchors */

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const match of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.has(match[1])) errors.push(`anchor has no target: #${match[1]}`);
}

/* ------------------------------------------------------------------ css */

let declared = new Set();
for (const file of cssFiles) {
  const css = read(file);

  const open = (css.match(/{/g) || []).length;
  const close = (css.match(/}/g) || []).length;
  if (open !== close) errors.push(`${file}: unbalanced braces (${open} { vs ${close} })`);

  for (const m of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declared.add(m[1]);
}
// Written at runtime by motion.js / inline reveal delays, never declared in CSS.
["--mx", "--my", "--px", "--py", "--i"].forEach((t) => declared.add(t));

for (const file of cssFiles) {
  const css = read(file);
  for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
    if (!declared.has(m[1])) errors.push(`${file}: undeclared token ${m[1]}`);
  }
}

/* ------------------------------------------------------------------- js */

for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "pipe" });
    notes.push(`syntax ok: ${file}`);
  } catch (err) {
    errors.push(`${file}: ${String(err.stderr || err).split("\n")[0]}`);
  }
}

/* ---------------------------------------------------------- taste audit */

const EMOJI =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu;
const FILLER = [
  "unleash",
  "passionate",
  "cutting-edge",
  "seamless",
  "revolutioniz",
  "game-chang",
  "world-class",
  "next-generation",
  "harness the power",
  "unlock the potential",
  "blazing",
  "crafting digital experiences",
  "in today's fast-paced",
  "10x",
  "supercharge",
  "effortless"
];

const visibleText = html
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/<(script|style)[\s\S]*?<\/\1>/g, "")
  .replace(/<[^>]+>/g, " ");

const emojiHits = [...new Set(visibleText.match(EMOJI) || [])];
if (emojiHits.length) {
  fail(`emoji in copy: ${emojiHits.join(" ")}`);
}

const lower = visibleText.toLowerCase();
for (const phrase of FILLER) {
  if (lower.includes(phrase)) fail(`filler phrasing: "${phrase}"`);
}

if (/\b(a\s+(?:passionate|dedicated)\s+\w+)\b/i.test(visibleText)) {
  fail("self-description opener reads like a template");
}

/* ------------------------------------------------------------ dist copy */

const dist = join(root, "dist");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

for (const entry of readdirSync(root)) {
  if (["dist", "node_modules", "scripts", ".git", "package.json", "package-lock.json"].includes(entry)) continue;
  cpSync(join(root, entry), join(dist, entry), { recursive: true });
}
writeFileSync(join(dist, ".nojekyll"), "");

/* ---------------------------------------------------------------- report */

const bytes = readdirSync(dist, { recursive: true })
  .filter((f) => statSync(join(dist, f)).isFile())
  .reduce((sum, f) => sum + statSync(join(dist, f)).size, 0);

const say = (label, list) => {
  console.log(`\n${label} (${list.length})`);
  for (const item of list) console.log(`  ${label === "errors" ? "✗" : label === "warnings" ? "!" : "·"} ${item}`);
};

console.log("── build ─────────────────────────────────────────");
console.log(`  assets checked   ${assetPaths.size}`);
console.log(`  tokens declared  ${declared.size}`);
console.log(`  output           dist/ (${(bytes / 1024).toFixed(1)} kB)`);
if (warnings.length) say("warnings", warnings);
if (errors.length) say("errors", errors);
if (!warnings.length && !errors.length) console.log("\n  clean — no warnings, no errors.");

process.exit(errors.length ? 1 : 0);
