import { useEffect, useMemo, useState } from 'react';
import { buildIndex, fieldOptions, search, sortIds, QUERY_FIELDS } from './query';
import QueryPanel from './components/QueryPanel';
import ResultsTable from './components/ResultsTable';

const EMPTY = { year: '', method: '', host: '', facility: '' };

export default function App() {
  const [data, setData] = useState(null); // { rows, fetchedAt }
  const [loadError, setLoadError] = useState('');
  const [criteria, setCriteria] = useState(EMPTY);
  const [results, setResults] = useState(null); // row ids, or null before a search
  const [searchMs, setSearchMs] = useState(0);
  const [error, setError] = useState('');
  const [sort, setSort] = useState(null); // { column, direction }

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}planets.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setLoadError(`Couldn't load the exoplanet data (${err.message}).`));
  }, []);

  // Built once when the data arrives; every search after that uses the index
  const index = useMemo(() => data && buildIndex(data.rows), [data]);
  const options = useMemo(
    () => index && Object.fromEntries(QUERY_FIELDS.map(({ key }) => [key, fieldOptions(index, key)])),
    [index]
  );
  // Case-insensitive lookup so typing "trappist-1" still finds "TRAPPIST-1"
  const hostsByLowercase = useMemo(
    () => index && new Map([...index.host.keys()].map((h) => [h.toLowerCase(), h])),
    [index]
  );

  const sortedResults = useMemo(
    () => (results && sort ? sortIds(data.rows, results, sort.column, sort.direction) : results),
    [results, sort, data]
  );

  const runSearch = () => {
    const query = { ...criteria };
    if (query.host) {
      const host = hostsByLowercase.get(query.host.trim().toLowerCase());
      if (!host) {
        setError(`No host named "${query.host.trim()}". Pick a host name from the list.`);
        return;
      }
      query.host = host;
      setCriteria(query);
    }
    const start = performance.now();
    const ids = search(data.rows, index, query);
    const elapsed = performance.now() - start;
    if (ids === null) {
      setError('Select at least one value to search.');
      return;
    }
    setError('');
    setResults(ids);
    setSearchMs(elapsed);
  };

  const clear = () => {
    setCriteria(EMPTY);
    setResults(null);
    setError('');
    setSort(null);
  };

  return (
    <div className="page">
      <header className="header">
        <h1>
          <span className="planet-icon" aria-hidden="true" />
          NASA Exoplanet Query
        </h1>
        <p className="subtitle">
          {data ? (
            <>
              Search <strong>{data.rows.length.toLocaleString()}</strong> confirmed exoplanets from the{' '}
              <a href="https://exoplanetarchive.ipac.caltech.edu/" target="_blank" rel="noreferrer">
                NASA Exoplanet Archive
              </a>
              {' · '}data updated {new Date(data.fetchedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </>
          ) : (
            'Search confirmed exoplanets from the NASA Exoplanet Archive'
          )}
        </p>
      </header>

      <main>
        {loadError ? (
          <div className="panel error-panel" role="alert">{loadError}</div>
        ) : !data ? (
          <div className="panel loading" aria-live="polite">Loading exoplanet data…</div>
        ) : (
          <>
            <QueryPanel
              criteria={criteria}
              options={options}
              onChange={(key, value) => setCriteria((c) => ({ ...c, [key]: value }))}
              onSearch={runSearch}
              onClear={clear}
              error={error}
            />
            <ResultsTable rows={data.rows} ids={sortedResults} searchMs={searchMs} sort={sort} onSort={setSort} />
          </>
        )}
      </main>
    </div>
  );
}
