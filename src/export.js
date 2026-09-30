// CSV export of search results (RFC 4180: quote fields containing commas, quotes or newlines)
import { COL } from './query.js';

export const EXPORT_COLUMNS = [
  ['Planet', COL.planet],
  ['Host name', COL.host],
  ['Discovery year', COL.year],
  ['Discovery method', COL.method],
  ['Discovery facility', COL.facility],
];

const escapeField = (value) => {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export function toCsv(rows, ids) {
  const lines = [EXPORT_COLUMNS.map(([label]) => label)];
  for (const id of ids) lines.push(EXPORT_COLUMNS.map(([, col]) => rows[id][col]));
  return lines.map((line) => line.map(escapeField).join(',')).join('\r\n') + '\r\n';
}

// e.g. "exoplanets-2016-transit.csv"
export function csvFilename(query) {
  const parts = Object.values(query)
    .filter(Boolean)
    .map((v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  return `exoplanets${parts.length ? `-${parts.join('-')}` : ''}.csv`;
}
