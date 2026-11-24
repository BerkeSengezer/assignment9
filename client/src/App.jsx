import { useEffect, useState } from 'react';
import { createBook, deleteBook, editBook, listBooks, replaceBook } from './api/books.js';
import Filters from './Filters.jsx';
import BookForm from './BookForm.jsx';
import BookRow from './BookRow.jsx';

const initialFilters = { q: '', genre: '', read: '', sort: '', order: 'asc' };

export default function App() {
  const [filters, setFilters] = useState(initialFilters);
  const [books, setBooks] = useState(null);
  const [listError, setListError] = useState('');

  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [version, setVersion] = useState(0);
  const [formKey, setFormKey] = useState(0);

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
  }, [filters, version]);

  async function makeChange(operation, onSuccess) {
    setBusy(true);
    setSaveError('');
    try {
      await operation();
      onSuccess?.();
      setVersion((previous) => previous + 1);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setBusy(false);
    }
  }

  function submitBook(fields) {
    makeChange(() => editing ? replaceBook(editing.id, fields) : createBook(fields), () => {
      setEditing(null);
      setFormKey((previous) => previous + 1);
    });
  }

  return (
    <main>
      <h1>Reading List</h1>
      {saveError && <p role="alert">{saveError}</p>}
      <BookForm key={editing?.id ?? `new-${formKey}`} book={editing} busy={busy}
        onSubmit={submitBook} onCancel={() => { setEditing(null); setSaveError(''); }} />
      <section>
        <h2>Books</h2>
        <Filters filters={filters} onChange={setFilters} />
        {listError && <p role="alert">{listError}</p>}
        {!listError && books === null && <p role="status">Loading books…</p>}
        {books?.length === 0 && <p>No matching books.</p>}
        {books?.length > 0 && (
          <ul className="book-list">
            {books.map((book) => (
              <BookRow key={book.id} book={book} locked={busy || editing !== null}
                onEdit={(selected) => { setEditing(selected); setSaveError(''); }}
                onPatch={(id, fields) => makeChange(() => editBook(id, fields))}
                onDelete={(id) => makeChange(() => deleteBook(id))} />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
