// Search engine for the exoplanet table.
//
// Rows are arrays: [planetName, hostName, discoveryYear, discoveryMethod, discoveryFacility].
// buildIndex() makes one inverted index per queryable field (value -> row ids), built once
// in O(n). A search looks up each selected value in O(1), starts from the shortest list
// of matches and checks only those rows against the other criteria, so it costs
// O(smallest match list) instead of scanning all rows.

export const COL = { planet: 0, host: 1, year: 2, method: 3, facility: 4 };

// The query panel's dropdowns, in display order
export const QUERY_FIELDS = [
  { key: 'year', label: 'Discovery year' },
  { key: 'method', label: 'Discovery method' },
  { key: 'host', label: 'Host name' },
  { key: 'facility', label: 'Discovery facility' },
];

export function buildIndex(rows) {
  const index = {};
  for (const { key } of QUERY_FIELDS) {
    const col = COL[key];
    const byValue = new Map();
    rows.forEach((row, id) => {
      const value = String(row[col]);
      let ids = byValue.get(value);
      if (!ids) byValue.set(value, (ids = []));
      ids.push(id);
    });
    index[key] = byValue;
  }
  return index;
}

// Dropdown options for a field: [{ value, count }], newest first for years, A–Z otherwise
export function fieldOptions(index, key) {
  const options = [...index[key]].map(([value, ids]) => ({ value, count: ids.length }));
  if (key === 'year') return options.sort((a, b) => Number(b.value) - Number(a.value));
  return options.sort((a, b) => a.value.localeCompare(b.value, 'en', { numeric: true }));
}

// criteria: { year?: '2016', method?: 'Transit', host?: 'Kepler-11', facility?: 'Kepler' }
// Returns the matching row ids (in dataset order), or null if no criteria were selected.
export function search(rows, index, criteria) {
  const active = QUERY_FIELDS.map(({ key }) => [key, criteria[key]]).filter(([, v]) => v);
  if (active.length === 0) return null;

  const lookups = active
    .map(([key, value]) => ({ key, value, ids: index[key].get(String(value)) ?? [] }))
    .sort((a, b) => a.ids.length - b.ids.length);
  const [smallest, ...others] = lookups;

  return smallest.ids.filter((id) => others.every(({ key, value }) => String(rows[id][COL[key]]) === value));
}

const compareText = (a, b) => a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });

// Returns a new, sorted array of row ids. column is a COL key; direction 'asc' | 'desc'.
export function sortIds(rows, ids, column, direction) {
  const col = COL[column];
  const sign = direction === 'desc' ? -1 : 1;
  const numeric = column === 'year';
  return [...ids].sort((a, b) => {
    const x = rows[a][col];
    const y = rows[b][col];
    const diff = numeric ? x - y : compareText(x, y);
    // Ties fall back to planet name so the order is stable and predictable
    return sign * diff || compareText(rows[a][COL.planet], rows[b][COL.planet]);
  });
}

// NASA's overview page for a planetary system, keyed by host name
export const overviewUrl = (host) =>
  `https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(host)}`;
