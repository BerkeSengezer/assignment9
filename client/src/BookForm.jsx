import { genres } from './genres.js';

export default function BookForm({ book, busy, onSubmit, onCancel }) {
  function submit(event) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    onSubmit({
      title: fields.get('title'),
      author: fields.get('author'),
      year: Number(fields.get('year')),
      genre: fields.get('genre'),
      read: book?.read ?? false,
      rating: book?.rating ?? null,
    });
  }

  return (
    <form onSubmit={submit}>
      <h2>{book ? 'Edit book' : 'Add a book'}</h2>
      <fieldset disabled={busy}>
        <label>Title<input name="title" defaultValue={book?.title} required maxLength={100} /></label>
        <label>Author<input name="author" defaultValue={book?.author} required maxLength={100} /></label>
        <label>
          Year
          <input name="year" type="number" min={1000} max={new Date().getFullYear()} defaultValue={book?.year} required />
        </label>
        <label>
          Genre
          <select name="genre" defaultValue={book?.genre ?? ''} required>
            <option value="" disabled>Select a genre</option>
            {genres.map((genre) => <option key={genre}>{genre}</option>)}
          </select>
        </label>
        <div className="actions">
          <button type="submit">{busy ? 'Saving…' : book ? 'Save changes' : 'Add book'}</button>
          {book && <button type="button" onClick={onCancel}>Cancel</button>}
        </div>
      </fieldset>
    </form>
  );
}
