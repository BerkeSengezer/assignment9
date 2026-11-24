import { readBookInput } from './book.js';

let books = [
  { id: 1, title: 'Frankenstein', author: 'Mary Shelley', year: 1818, genre: 'fiction', read: true, rating: 4 },
  { id: 2, title: 'The Fellowship of the Ring', author: 'J.R.R. Tolkien', year: 1954, genre: 'fantasy', read: true, rating: 5 },
  { id: 3, title: 'Cosmos', author: 'Carl Sagan', year: 1980, genre: 'science', read: false, rating: null },
  { id: 4, title: 'Kindred', author: 'Octavia E. Butler', year: 1979, genre: 'fiction', read: false, rating: null },
  { id: 5, title: 'The Guns of August', author: 'Barbara W. Tuchman', year: 1962, genre: 'history', read: false, rating: null },
  { id: 6, title: 'Piranesi', author: 'Susanna Clarke', year: 2020, genre: 'fantasy', read: true, rating: null },
];
let nextId = 7;

function pause() {
  return new Promise((resolve) => setTimeout(resolve, 15));
}

export async function allBooks() {
  await pause();
  return books.map((book) => ({ ...book }));
}

export async function bookById(id) {
  await pause();
  const book = books.find((item) => item.id === id);
  return book ? { ...book } : null;
}

export async function writeBook(id, input, partial = false) {
  await pause();
  const existing = books.find((item) => item.id === id);
  if (id !== null && !existing) return { status: 404, error: 'Book not found' };

  const result = readBookInput(input, partial ? existing : undefined);
  if (result.error) return { status: 400, error: result.error };

  const candidate = result.book;
  const title = candidate.title.toLowerCase();
  const author = candidate.author.toLowerCase();
  const duplicate = books.some((item) => item.id !== id &&
    item.title.toLowerCase() === title && item.author.toLowerCase() === author);
  if (duplicate) return { status: 409, error: 'A book with this title and author already exists' };

  const book = { ...candidate, id: id ?? nextId++ };
  books = id === null ? [...books, book] : books.map((item) => item.id === id ? book : item);
  return { book: { ...book } };
}

export async function removeBook(id) {
  await pause();
  const remaining = books.filter((book) => book.id !== id);
  if (remaining.length === books.length) return false;
  books = remaining;
  return true;
}
