import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv, csvFilename } from '../src/export.js';
import { parseCsv } from '../src/csv.js';

const rows = [
  ['Kepler-11 b', 'Kepler-11', 2010, 'Transit', 'Kepler'],
  ['Odd, "quoted" b', 'Host, A', 2020, 'Imaging', 'Multi\nline'],
];

test('writes a header and the selected rows in the given order', () => {
  assert.equal(
    toCsv(rows, [0]),
    'Planet,Host name,Discovery year,Discovery method,Discovery facility\r\nKepler-11 b,Kepler-11,2010,Transit,Kepler\r\n'
  );
});

test('escapes commas, quotes and newlines so the CSV parses back exactly', () => {
  const parsed = parseCsv(toCsv(rows, [1, 0]));
  assert.deepEqual(parsed[1], ['Odd, "quoted" b', 'Host, A', '2020', 'Imaging', 'Multi\nline']);
  assert.deepEqual(parsed[2], ['Kepler-11 b', 'Kepler-11', '2010', 'Transit', 'Kepler']);
});

test('builds a readable filename from the query', () => {
  assert.equal(csvFilename({ year: '2016', method: 'Radial Velocity', host: '', facility: '' }), 'exoplanets-2016-radial-velocity.csv');
  assert.equal(csvFilename({ year: '', method: '', host: '', facility: '' }), 'exoplanets.csv');
});
