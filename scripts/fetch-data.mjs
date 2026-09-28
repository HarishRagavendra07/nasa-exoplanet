// Downloads confirmed exoplanets from the NASA Exoplanet Archive and writes a compact
// snapshot to public/planets.json, so the app never waits on NASA's slow API at startup.
// Run: npm run fetch-data
import { readFile, writeFile } from 'node:fs/promises';
import { parseCsv } from '../src/csv.js';

const COLUMNS = ['pl_name', 'hostname', 'disc_year', 'discoverymethod', 'disc_facility'];
// pscomppars = one row per confirmed planet
const URL =
  'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?format=csv&query=' +
  encodeURIComponent(`select ${COLUMNS.join(',')} from pscomppars`);
const OUT = new globalThis.URL('../public/planets.json', import.meta.url);

async function download(attempts = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(URL, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (i >= attempts) throw err;
      console.warn(`Download failed (${err.message}), retrying…`);
    }
  }
}

console.log('Downloading from NASA Exoplanet Archive…');
const [header, ...records] = parseCsv(await download());
if (COLUMNS.some((c, i) => header[i] !== c)) {
  throw new Error(`Unexpected columns: ${header.join(', ')}`);
}

const rows = records
  .filter((r) => r.length === COLUMNS.length && r[0])
  .map(([name, host, year, method, facility]) => [
    name.trim(),
    host.trim(),
    year ? Number(year) : null,
    method.trim(),
    facility.trim(),
  ])
  .sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true }));

// Keep the old file (and its date) if nothing changed, so scheduled refreshes don't make empty commits
const previous = await readFile(OUT, 'utf8').then(JSON.parse).catch(() => null);
if (previous && JSON.stringify(previous.rows) === JSON.stringify(rows)) {
  console.log(`No changes (${rows.length} planets); public/planets.json left as is`);
  process.exit(0);
}

const snapshot = {
  source: 'NASA Exoplanet Archive — Planetary Systems Composite Parameters (pscomppars)',
  fetchedAt: new Date().toISOString(),
  columns: COLUMNS,
  rows,
};
await writeFile(OUT, JSON.stringify(snapshot));
console.log(`Wrote ${rows.length} planets to public/planets.json`);
