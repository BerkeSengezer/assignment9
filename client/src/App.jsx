import { useEffect, useState } from 'react';
import { listBooks } from './api/books.js';
import Filters from './Filters.jsx';

const initialFilters = { q: '', genre: '', read: '', sort: '', order: 'asc' };

export default function App() {
  const [filters, setFilters] = useState(initialFilters);
  const [books, setBooks] = useState(null);
  const [listError, setListError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setBooks(null);
    setListError('');
    listBooks(filters, controller.signal).then((result) => {
      if (!controller.signal.aborted) setBooks(result);
    }).catch((error) => {
      if (!controller.signal.aborted && error.name !== 'AbortError') setListError(error.message);
    });
    return () => controller.abort();
  }, [filters]);

  return (
    <main>
      <h1>Reading List</h1>
      <section>
        <h2>Books</h2>
        <Filters filters={filters} onChange={setFilters} />
        {listError && <p role="alert">{listError}</p>}
        {!listError && books === null && <p role="status">Loading books…</p>}
        {books?.length === 0 && <p>No matching books.</p>}
        {books?.length > 0 && (
          <ul className="book-list">
            {books.map((book) => (
              <li key={book.id}>
                <h3>{book.title}</h3>
                <p>{book.author} · {book.year} · {book.genre}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
