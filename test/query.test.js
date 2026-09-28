import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildIndex, fieldOptions, search, sortIds, overviewUrl, COL } from '../src/query.js';
import { parseCsv } from '../src/csv.js';

const rows = [
  ['Kepler-11 b', 'Kepler-11', 2010, 'Transit', 'Kepler'],
  ['Kepler-11 c', 'Kepler-11', 2010, 'Transit', 'Kepler'],
  ['51 Peg b', '51 Peg', 1995, 'Radial Velocity', 'Haute-Provence Observatory'],
  ['HD 2039 b', 'HD 2039', 2002, 'Radial Velocity', 'Anglo-Australian Telescope'],
  ['K2-43 b', 'K2-43', 2016, 'Transit', 'K2'],
  ['Kepler-2 b', 'Kepler-2', 2010, 'Transit', 'Kepler'],
];
const index = buildIndex(rows);

test('returns null when nothing is selected', () => {
  assert.equal(search(rows, index, {}), null);
  assert.equal(search(rows, index, { year: '', method: '' }), null);
});

test('matches a single field', () => {
  assert.deepEqual(search(rows, index, { method: 'Radial Velocity' }), [2, 3]);
  assert.deepEqual(search(rows, index, { year: '2010' }), [0, 1, 5]);
});

test('matches ALL selected fields', () => {
  assert.deepEqual(search(rows, index, { year: '2010', host: 'Kepler-11' }), [0, 1]);
  assert.deepEqual(search(rows, index, { method: 'Transit', facility: 'K2', year: '2016' }), [4]);
  assert.deepEqual(search(rows, index, { method: 'Transit', year: '1995' }), []);
});

test('unknown values match nothing', () => {
  assert.deepEqual(search(rows, index, { host: 'Nope' }), []);
});

test('dropdown options carry counts; years newest first, text A–Z (natural order)', () => {
  assert.deepEqual(fieldOptions(index, 'year').map((o) => o.value), ['2016', '2010', '2002', '1995']);
  assert.deepEqual(fieldOptions(index, 'year')[1], { value: '2010', count: 3 });
  assert.deepEqual(fieldOptions(index, 'host').map((o) => o.value), ['51 Peg', 'HD 2039', 'K2-43', 'Kepler-2', 'Kepler-11']);
});

test('sorts ascending and descending, numeric-aware, ties broken by planet name', () => {
  const all = rows.map((_, i) => i);
  assert.deepEqual(sortIds(rows, all, 'year', 'asc').map((i) => rows[i][COL.year]), [1995, 2002, 2010, 2010, 2010, 2016]);
  assert.deepEqual(sortIds(rows, all, 'year', 'desc').map((i) => rows[i][COL.planet]), ['K2-43 b', 'Kepler-2 b', 'Kepler-11 b', 'Kepler-11 c', 'HD 2039 b', '51 Peg b']);
  assert.deepEqual(sortIds(rows, [0, 5], 'host', 'asc'), [5, 0]); // Kepler-2 before Kepler-11
  assert.deepEqual(all, [0, 1, 2, 3, 4, 5], 'input is not mutated');
});

test('overview links are URL-encoded', () => {
  assert.equal(overviewUrl('HD 2039'), 'https://exoplanetarchive.ipac.caltech.edu/overview/HD%202039');
});

test('CSV parser handles quotes, escaped quotes, commas and CRLF', () => {
  assert.deepEqual(parseCsv('a,b\r\n"x, y","say ""hi"""\n1,\n'), [['a', 'b'], ['x, y', 'say "hi"'], ['1', '']]);
});

test('index search agrees with a brute-force scan on the real NASA data', () => {
  const data = JSON.parse(readFileSync(new URL('../public/planets.json', import.meta.url)));
  const idx = buildIndex(data.rows);
  const queries = [
    { method: 'Transit' },
    { year: '2016', method: 'Transit' },
    { facility: 'Kepler', year: '2014' },
    { host: 'TRAPPIST-1' },
    { year: '1995', method: 'Radial Velocity', facility: 'Haute-Provence Observatory', host: '51 Peg' },
  ];
  for (const q of queries) {
    const expected = data.rows
      .map((row, id) => ({ row, id }))
      .filter(({ row }) => Object.entries(q).every(([k, v]) => String(row[COL[k]]) === v))
      .map(({ id }) => id);
    assert.deepEqual(search(data.rows, idx, q), expected, JSON.stringify(q));
    assert.ok(expected.length > 0, `query should have results: ${JSON.stringify(q)}`);
  }
});
