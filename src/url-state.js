// Keeps a search in the page URL (e.g. ?year=2016&method=Transit&sort=year-desc)
// so results can be bookmarked or shared, and Back/Forward move between searches.
import { QUERY_FIELDS } from './query.js';

const SORT_COLUMNS = new Set(['planet', 'host', 'year', 'method', 'facility']);
const DIRECTIONS = new Set(['asc', 'desc']);

// Returns '?…' or '' when there is nothing to keep
export function toSearch(criteria, sort) {
  const params = new URLSearchParams();
  for (const { key } of QUERY_FIELDS) if (criteria[key]) params.set(key, criteria[key]);
  if (sort) params.set('sort', `${sort.column}-${sort.direction}`);
  const query = params.toString();
  return query ? `?${query}` : '';
}

// Unknown parameters and malformed sort values are ignored
export function fromSearch(search) {
  const params = new URLSearchParams(search);
  const criteria = Object.fromEntries(QUERY_FIELDS.map(({ key }) => [key, (params.get(key) ?? '').trim()]));
  const [column, direction] = (params.get('sort') ?? '').split('-');
  const sort = SORT_COLUMNS.has(column) && DIRECTIONS.has(direction) ? { column, direction } : null;
  const hasCriteria = Object.values(criteria).some(Boolean);
  return { criteria, sort, hasCriteria };
}
