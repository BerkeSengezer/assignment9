import express from 'express';
import cors from 'cors';
import { parseBookId } from './book.js';
import { filterBooks } from './bookQuery.js';
import { allBooks, bookById, writeBook, removeBook } from './booksStore.js';

const app = express();
const port = process.env.PORT ?? 3000;
app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

function sendError(res, status, error) {
  return res.status(status).json({ error });
}

app.param('id', (req, res, next, rawId) => {
  const id = parseBookId(rawId);
  if (id === null) return sendError(res, 400, 'id must be a positive integer');
  req.bookId = id;
  next();
});

app.get('/api/books', async (req, res) => {
  const result = filterBooks(await allBooks(), req.query);
  if (result.error) return sendError(res, 400, result.error);
  return res.json(result.books);
});

app.get('/api/books/:id', async (req, res) => {
  const book = await bookById(req.bookId);
  if (!book) return sendError(res, 404, 'Book not found');
  return res.json(book);
});

app.post('/api/books', async (req, res) => {
  const result = await writeBook(null, req.body);
  if (result.error) return sendError(res, result.status, result.error);
  return res.status(201).location(`/api/books/${result.book.id}`).json(result.book);
});

app.put('/api/books/:id', async (req, res) => {
  const result = await writeBook(req.bookId, req.body);
  if (result.error) return sendError(res, result.status, result.error);
  return res.json(result.book);
});

app.patch('/api/books/:id', async (req, res) => {
  const result = await writeBook(req.bookId, req.body, true);
  if (result.error) return sendError(res, result.status, result.error);
  return res.json(result.book);
});

app.delete('/api/books/:id', async (req, res) => {
  if (!await removeBook(req.bookId)) return sendError(res, 404, 'Book not found');
  return res.status(204).end();
});

app.get('/api/stats', async (req, res) => {
  const books = await allBooks();
  const byGenre = {};
  let read = 0;
  let rated = 0;
  let ratingSum = 0;

  for (const book of books) {
    byGenre[book.genre] = (byGenre[book.genre] ?? 0) + 1;
    if (book.read) read++;
    if (book.rating !== null) {
      rated++;
      ratingSum += book.rating;
    }
  }

  const total = books.length;
  const averageRating = rated === 0 ? null : Math.round(ratingSum / rated * 10) / 10;
  return res.json({ total, read, unread: total - read, averageRating, byGenre });
});

app.get('/api/crash', async () => {
  throw new Error('Example async route failure');
});

app.use('/api', (req, res) => sendError(res, 404, 'Not found'));

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return sendError(res, 400, 'Malformed JSON request body');
  return sendError(res, 500, 'Something went wrong');
});

app.listen(port, () => console.log(`Reading List API listening on ${port}`));
