// Builds dist/sw.js, the service worker that keeps the web app's own files on the device so it
// opens without a connection. Run by `npm run export:web` after the export. The weather itself is
// not cached here: the app keeps its own copy, and shows how old it is.
module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{js,html,json,ico,png}',
    // Only the fonts the app draws with: its weather icons and Material Icons. The export also
    // carries @expo/vector-icons' other icon fonts, several MB the app never loads.
    'assets/assets/fonts/*.ttf',
    'assets/node_modules/@expo/vector-icons/**/MaterialIcons.*.ttf',
  ],
  // 404.html is a copy of index.html for GitHub Pages, and the service worker answers for it below.
  globIgnores: ['404.html', 'sw.js', 'workbox-*.js'],
  // The bundle and the full-size artwork are each well over Workbox's 2 MB default.
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
  swDest: 'dist/sw.js',
  // Any page of the app, such as /weather-sage/day/2026-10-15, opens from the cached index.html.
  navigateFallback: 'index.html',
  // A new deploy takes over on the next visit, rather than once every tab of the app has closed.
  skipWaiting: true,
  clientsClaim: true,
  // Keep everything in sw.js rather than loading Workbox from a CDN at run time.
  inlineWorkboxRuntime: true,
  cleanupOutdatedCaches: true,
};
