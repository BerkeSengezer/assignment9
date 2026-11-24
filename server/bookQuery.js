import { genres, parseBookId } from './book.js';

const sortFields = ['title', 'author', 'year', 'rating'];

export function filterBooks(books, query) {
  for (const name of Object.keys(query)) {
    if (typeof query[name] !== 'string') return { error: `Use ${name} only once` };
  }

  const { genre, read, q = '', sort, order = 'asc', limit = '50', page = '1' } = query;
  if (genre !== undefined && !genres.includes(genre)) return { error: 'Choose a supported genre' };
  if (read !== undefined && !['true', 'false'].includes(read)) return { error: 'read must be true or false' };
  if (sort !== undefined && !sortFields.includes(sort)) return { error: 'sort must be title, author, year, or rating' };
  if (!['asc', 'desc'].includes(order)) return { error: 'order must be asc or desc' };

  const size = parseBookId(limit);
  const pageNumber = parseBookId(page);
  if (size === null || size > 50) return { error: 'limit must be an integer from 1 to 50' };
  if (pageNumber === null) return { error: 'page must be a positive integer' };

  const search = q.trim().toLowerCase();
  const matching = books.filter((book) => {
    if (genre !== undefined && book.genre !== genre) return false;
    if (read !== undefined && book.read !== (read === 'true')) return false;
    return book.title.toLowerCase().includes(search) || book.author.toLowerCase().includes(search);
  });

  const field = sort ?? 'id';
  const direction = order === 'asc' ? 1 : -1;
  matching.sort((left, right) => {
    if (field === 'rating') {
      if (left.rating === null) return right.rating === null ? 0 : 1;
      if (right.rating === null) return -1;
    }
    const a = left[field];
    const b = right[field];
    return direction * (typeof a === 'string' ? a.localeCompare(b) : a - b);
  });

  const start = (pageNumber - 1) * size;
  return { books: matching.slice(start, start + size) };
}
