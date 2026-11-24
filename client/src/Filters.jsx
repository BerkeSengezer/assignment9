import { genres } from './genres.js';

export default function Filters({ filters, onChange }) {
  function update(event) {
    const { name, value } = event.target;
    onChange((previous) => ({ ...previous, [name]: value }));
  }

  return (
    <div className="filters">
      <label>
        Search
        <input name="q" type="search" value={filters.q} onChange={update} placeholder="Title or author" />
      </label>
      <label>
        Genre
        <select name="genre" value={filters.genre} onChange={update}>
          <option value="">All genres</option>
          {genres.map((genre) => <option key={genre}>{genre}</option>)}
        </select>
      </label>
      <label>
        Status
        <select name="read" value={filters.read} onChange={update}>
          <option value="">All books</option>
          <option value="true">Read</option>
          <option value="false">Unread</option>
        </select>
      </label>
      <label>
        Sort
        <select name="sort" value={filters.sort} onChange={update}>
          <option value="">Book ID</option>
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="year">Year</option>
          <option value="rating">Rating</option>
        </select>
      </label>
      <label>
        Direction
        <select name="order" value={filters.order} onChange={update}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </label>
    </div>
  );
}
