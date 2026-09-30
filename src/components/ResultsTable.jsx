import { useState } from 'react';
import { COL, overviewUrl } from '../query';

const PAGE = 100;
const COLUMNS = [
  { key: 'planet', label: 'Planet' },
  { key: 'host', label: 'Host name' },
  { key: 'year', label: 'Discovery year' },
  { key: 'method', label: 'Discovery method' },
  { key: 'facility', label: 'Discovery facility' },
];

function SortButtons({ column, label, sort, onSort }) {
  const button = (direction, symbol, word) => {
    const active = sort?.column === column && sort.direction === direction;
    return (
      <button
        type="button"
        className={`sort-btn ${active ? 'active' : ''}`}
        onClick={() => onSort({ column, direction })}
        aria-label={`Sort by ${label}, ${word}`}
        aria-pressed={active}
        title={`Sort ${word}`}
      >
        {symbol}
      </button>
    );
  };
  return (
    <span className="sort-btns">
      {button('asc', '▲', 'ascending')}
      {button('desc', '▼', 'descending')}
    </span>
  );
}

export default function ResultsTable({ rows, ids, searchMs, sort, onSort }) {
  // App remounts this table for each new search, so paging starts over then but survives re-sorting
  const [limit, setLimit] = useState(PAGE);
  const [copied, setCopied] = useState(false);

  const copyLink = () =>
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });

  if (ids === null) {
    return (
      <section className="panel results-panel empty-state" aria-label="Results">
        <p>Choose one or more values above and press <strong>Search</strong>.</p>
        <p className="muted">Tip: try Discovery method “Imaging”, or host “TRAPPIST-1”.</p>
      </section>
    );
  }

  const ariaSort = (key) =>
    sort?.column === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <section className="panel results-panel" aria-labelledby="results-heading">
      <div className="results-header">
        <h2 id="results-heading">Results</h2>
        <div className="results-meta">
          <span className="muted" aria-live="polite">
            {ids.length.toLocaleString()} {ids.length === 1 ? 'planet' : 'planets'} found in{' '}
            {searchMs < 1 ? '<1' : searchMs.toFixed(1)} ms
          </span>
          <button type="button" className="btn btn-small" onClick={copyLink} title="Copy a link to this search">
            {copied ? 'Link copied ✓' : 'Copy link'}
          </button>
        </div>
      </div>

      {ids.length === 0 ? (
        <p className="empty-state">No exoplanets match all of the selected values. Try removing one.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {COLUMNS.map(({ key, label }) => (
                    <th key={key} scope="col" aria-sort={ariaSort(key)}>
                      <span className="th-inner">
                        {label}
                        <SortButtons column={key} label={label} sort={sort} onSort={onSort} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ids.slice(0, limit).map((id) => {
                  const row = rows[id];
                  return (
                    <tr key={id}>
                      <td>{row[COL.planet]}</td>
                      <td>
                        <a href={overviewUrl(row[COL.host])} target="_blank" rel="noreferrer">
                          {row[COL.host]}
                        </a>
                      </td>
                      <td className="num">{row[COL.year]}</td>
                      <td>{row[COL.method]}</td>
                      <td>{row[COL.facility]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {ids.length > limit && (
            <div className="more">
              <span className="muted">
                Showing {limit.toLocaleString()} of {ids.length.toLocaleString()}
              </span>
              <button type="button" className="btn btn-secondary" onClick={() => setLimit((l) => l + PAGE)}>
                Show {Math.min(PAGE, ids.length - limit)} more
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
