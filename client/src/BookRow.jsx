export default function BookRow({ book, locked, onEdit, onPatch, onDelete }) {
  function toggleRead() {
    onPatch(book.id, book.read ? { read: false, rating: null } : { read: true });
  }

  function changeRating(event) {
    const rating = event.target.value;
    onPatch(book.id, { rating: rating === '' ? null : Number(rating) });
  }

  return (
    <li>
      <h3>{book.title}</h3>
      <p>{book.author} · {book.year} · {book.genre} · {book.read ? 'Read' : 'Unread'}</p>
      <div className="actions">
        <button disabled={locked} onClick={() => onEdit(book)}>Edit</button>
        <button disabled={locked} onClick={toggleRead}>{book.read ? 'Mark unread' : 'Mark read'}</button>
        <label className="rating">
          Rating
          <select aria-label={`Rating for ${book.title}`} disabled={locked || !book.read}
            value={book.rating ?? ''} onChange={changeRating}>
            <option value="">Unrated</option>
            {[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <button className="delete" disabled={locked} onClick={() => onDelete(book.id)}>Delete</button>
      </div>
    </li>
  );
}
