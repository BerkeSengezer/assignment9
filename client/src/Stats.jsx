export default function Stats({ data, error }) {
  return (
    <section aria-labelledby="stats-title">
      <h2 id="stats-title">Statistics</h2>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p role="status">Loading statistics…</p>}
      {data && (
        <>
          <dl className="summary">
            <div><dt>Total</dt><dd>{data.total}</dd></div>
            <div><dt>Read</dt><dd>{data.read}</dd></div>
            <div><dt>Unread</dt><dd>{data.unread}</dd></div>
            <div><dt>Average rating</dt><dd>{data.averageRating ?? 'Unrated'}</dd></div>
          </dl>
          {Object.keys(data.byGenre).length > 0 && (
            <p>{Object.entries(data.byGenre).map(([genre, count]) => `${genre}: ${count}`).join(' · ')}</p>
          )}
        </>
      )}
    </section>
  );
}
