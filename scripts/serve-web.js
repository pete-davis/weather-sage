#!/usr/bin/env node

/**
 * Serves the web export in dist/ the way GitHub Pages does, for trying the published site locally,
 * service worker and install included: `npm run preview:web`, then open the printed address.
 *
 * - Everything is under the base path, /weather-sage/ (experiments.baseUrl in app.json).
 * - A path is tried as a file, then with .html, then as a folder's index.html.
 * - Anything else gets 404.html with a 404 status, as Pages does for direct links.
 *
 * localhost counts as a secure origin, so browsers allow the service worker here.
 */

const fs = require("fs");
const http = require("http");
const path = require("path");

const BASE = "/weather-sage";
const PORT = Number(process.env.PORT) || 4173;
const dist = path.join(process.cwd(), "dist");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
};

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/index.html not found. Run `npm run export:web` first.");
  process.exit(1);
}

function send(res, status, file) {
  res.writeHead(status, {
    "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
    // Like Pages, nothing is cached for long, so a fresh export shows on reload.
    "Cache-Control": "max-age=0",
  });
  fs.createReadStream(file).pipe(res);
}

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    if (url === "/" || url === BASE) {
      res.writeHead(302, { Location: `${BASE}/` });
      return res.end();
    }
    if (!url.startsWith(`${BASE}/`)) {
      res.writeHead(404);
      return res.end("Not under the base path");
    }
    const relative = url.slice(BASE.length);
    for (const candidate of [relative, `${relative}.html`, path.join(relative, "index.html")]) {
      const file = path.join(dist, candidate);
      if (file.startsWith(dist) && fs.existsSync(file) && fs.statSync(file).isFile()) {
        return send(res, 200, file);
      }
    }
    send(res, 404, path.join(dist, "404.html"));
  })
  .listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}${BASE}/`));
