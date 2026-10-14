#!/usr/bin/env node

/**
 * Readies the web export in dist/ for GitHub Pages. Run after `expo export -p web`.
 *
 * - 404.html: GitHub Pages serves it for any path with no file of its own, such as /day/2026-10-14.
 *   As a copy of index.html it starts the app, and Expo Router then shows the screen the URL names.
 * - .nojekyll: stops GitHub Pages from running Jekyll, which would drop the _expo folder.
 */

const fs = require("fs");
const path = require("path");

const dist = path.join(process.cwd(), "dist");
const index = path.join(dist, "index.html");

if (!fs.existsSync(index)) {
  console.error("dist/index.html not found. Run `npx expo export -p web` first.");
  process.exit(1);
}

fs.copyFileSync(index, path.join(dist, "404.html"));
fs.writeFileSync(path.join(dist, ".nojekyll"), "");
console.log("Added dist/404.html and dist/.nojekyll for GitHub Pages.");
