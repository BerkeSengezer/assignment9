export const genres = ['fiction', 'non-fiction', 'science', 'history', 'fantasy', 'other'];

export function parseBookId(value) {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id < 1) return null;
  return id;
}

export function readBookInput(input, previous = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: 'Send a JSON object containing the book fields' };
  }

  const fields = ['title', 'author', 'year', 'genre', 'read', 'rating'];
  const book = { read: false, rating: null };
  for (const name of fields) {
    if (Object.hasOwn(input, name)) {
      book[name] = input[name];
    } else if (Object.hasOwn(previous, name)) {
      book[name] = previous[name];
    }
  }

  for (const name of ['title', 'author']) {
    const value = typeof book[name] === 'string' ? book[name].trim() : '';
    if (value.length < 1 || value.length > 100) {
      return { error: `${name} must have 1 to 100 characters` };
    }
    book[name] = value;
  }

  const latestYear = new Date().getFullYear();
  if (!Number.isInteger(book.year) || book.year < 1000 || book.year > latestYear) {
    return { error: `year must be an integer from 1000 to ${latestYear}` };
  }
  if (!genres.includes(book.genre)) return { error: `genre must be one of: ${genres.join(', ')}` };
  if (typeof book.read !== 'boolean') return { error: 'read must be true or false' };
  if (book.rating !== null) {
    if (!Number.isInteger(book.rating) || book.rating < 1 || book.rating > 5) {
      return { error: 'rating must be null or an integer from 1 to 5' };
    }
    if (!book.read) return { error: 'Only read books can have a rating' };
  }

  return { book };
}
