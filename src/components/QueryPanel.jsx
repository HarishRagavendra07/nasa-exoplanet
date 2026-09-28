import { QUERY_FIELDS } from '../query';

const optionLabel = ({ value, count }) => `${value} (${count.toLocaleString()})`;

export default function QueryPanel({ criteria, options, onChange, onSearch, onClear, error }) {
  const submit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form className="panel query-panel" onSubmit={submit} aria-labelledby="query-heading">
      <h2 id="query-heading">Query</h2>
      <div className="fields">
        {QUERY_FIELDS.map(({ key, label }) => (
          <label key={key} className="field">
            <span>{label}</span>
            {key === 'host' ? (
              // ~4,800 hosts is too many for a plain dropdown, so this one filters as you type
              <>
                <input
                  type="text"
                  list="host-options"
                  placeholder="Type to search, e.g. TRAPPIST-1"
                  value={criteria.host}
                  onChange={(e) => onChange('host', e.target.value)}
                  autoComplete="off"
                />
                <datalist id="host-options">
                  {options.host.map((o) => (
                    <option key={o.value} value={o.value}>
                      {optionLabel(o)}
                    </option>
                  ))}
                </datalist>
              </>
            ) : (
              <select value={criteria[key]} onChange={(e) => onChange(key, e.target.value)}>
                <option value="">Any</option>
                {options[key].map((o) => (
                  <option key={o.value} value={o.value}>
                    {optionLabel(o)}
                  </option>
                ))}
              </select>
            )}
          </label>
        ))}
      </div>
      <div className="actions">
        <button type="button" className="btn btn-secondary" onClick={onClear}>
          Clear
        </button>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
