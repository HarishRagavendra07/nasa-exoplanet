# NASA Exoplanet Query

Search NASA's catalogue of **6,372 confirmed exoplanets** by discovery year, discovery method, host star and discovery facility. Results come back in under a millisecond.

Built with React and Vite as a static site: no backend, and it runs on GitHub Pages.

## Features

**Core**
- A query panel with dropdowns for **discovery year**, **discovery method**, **host name** and **discovery facility**. Each option shows how many planets it matches.
- **Search** finds planets that match *all* selected values. **Clear** resets the form and the results.
- An error message if you press Search with nothing selected, or type a host name that doesn't exist.
- Results appear in a table below the query panel.

**Bonus**
- Host names link to NASA's system overview page and open in a new tab.
- ▲ / ▼ buttons on every column sort the results ascending or descending. Sorting is number-aware, so `Kepler-2` comes before `Kepler-11`.

**Extras**
- The host name field filters as you type, since 4,779 hosts are too many for a plain dropdown. It's case-insensitive (`trappist-1` finds `TRAPPIST-1`).
- Results show 100 at a time with a "Show more" button, plus the match count and search time.
- **CSV export:** **Download CSV** saves every matching planet (not just the rows on screen) in the current sort order.
- **Shareable searches:** the query and sort order live in the URL (e.g. `?year=2016&method=Transit&sort=year-desc`), so a search can be bookmarked or shared with **Copy link**, and Back/Forward move between searches.
- Dark/light mode that follows your system, a mobile layout, and accessible labels and sort states.

## How it stays fast

**Loading.** NASA's archive API took about 20 seconds to respond when tested, far too slow to call when the app starts. Instead, `scripts/fetch-data.mjs` downloads the CSV once, parses it, and saves a compact snapshot to `public/planets.json`. That's about 47 KB gzipped, and the app is usable within about 0.2 s.

**Searching.** When the data loads, `buildIndex()` creates an inverted index for each queryable field in O(n): a `Map` from each value to the list of matching row ids. A search:
1. looks up each selected value in the index, which is O(1) per field;
2. starts from the **shortest** list of matches;
3. checks only those rows against the other selected values.

So a query costs O(size of the smallest match list) instead of O(all rows). For example, *2017 + Kepler* checks 152 rows, not 6,372. The unit tests confirm the index gives exactly the same results as a full scan of the real NASA data.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (node:test)
npm run build        # production build in dist/
npm run fetch-data   # refresh public/planets.json from NASA
```

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`. Every Monday it also refreshes the NASA data, and commits it only if something changed.

One-time setup after pushing: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Data

Source: the [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/), *Planetary Systems Composite Parameters* table (`pscomppars`, one row per confirmed planet), using the columns `pl_name`, `hostname`, `disc_year`, `discoverymethod` and `disc_facility`. See the archive's [column definitions](https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html).

Some systems are listed under a catalogue name rather than their common name. For example, Kepler-90's host is `KOI-351`.

## Project structure

```
scripts/fetch-data.mjs     download + parse NASA CSV → public/planets.json
src/csv.js                 small RFC 4180 CSV parser
src/query.js               index, search, sort (pure functions, unit-tested)
src/url-state.js           search <-> URL query string
src/export.js              CSV export
src/App.jsx                data loading and state
src/components/            QueryPanel, ResultsTable
test/query.test.js         unit tests, including a check against the real data
```

Project idea from [florinpop17/app-ideas](https://github.com/florinpop17/app-ideas/blob/master/Projects/3-Advanced/NASA-Exoplanet-Query.md).
