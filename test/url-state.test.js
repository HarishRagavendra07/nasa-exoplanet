import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSearch, fromSearch } from '../src/url-state.js';

const EMPTY = { year: '', method: '', host: '', facility: '' };

test('round-trips criteria and sort through the URL', () => {
  const criteria = { ...EMPTY, year: '2016', method: 'Radial Velocity', host: 'HD 2039' };
  const sort = { column: 'year', direction: 'desc' };
  const search = toSearch(criteria, sort);
  assert.equal(search, '?year=2016&method=Radial+Velocity&host=HD+2039&sort=year-desc');
  assert.deepEqual(fromSearch(search), { criteria, sort, hasCriteria: true });
});

test('empty state gives an empty query string', () => {
  assert.equal(toSearch(EMPTY, null), '');
  assert.deepEqual(fromSearch(''), { criteria: EMPTY, sort: null, hasCriteria: false });
});

test('ignores unknown parameters and malformed sort values', () => {
  assert.deepEqual(fromSearch('?foo=bar&sort=nope-up&facility=%20Kepler%20'), {
    criteria: { ...EMPTY, facility: 'Kepler' },
    sort: null,
    hasCriteria: true,
  });
  assert.equal(fromSearch('?sort=host-sideways').sort, null);
});
