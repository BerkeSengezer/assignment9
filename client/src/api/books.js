const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

async function request(path, { method = 'GET', body, signal } = {}) {
  const options = { method, signal };
  if (body !== undefined) {
    options.headers = { 'Content-Type': 'application/json' };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiBase}/api${path}`, options);
  if (response.status === 204) return undefined;

  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (error.name === 'AbortError' || response.ok) throw error;
  }
  if (!response.ok) throw new Error(data?.error ?? `Request failed (${response.status})`);
  return data;
}

export function listBooks(filters, signal) {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(filters)) {
    if (value !== '') query.set(name, value);
  }
  return request(`/books?${query.toString()}`, { signal });
}

export function readStats(signal) {
  return request('/stats', { signal });
}

export function createBook(body) {
  return request('/books', { method: 'POST', body });
}

export function replaceBook(id, body) {
  return request(`/books/${id}`, { method: 'PUT', body });
}

export function editBook(id, body) {
  return request(`/books/${id}`, { method: 'PATCH', body });
}

export function deleteBook(id) {
  return request(`/books/${id}`, { method: 'DELETE' });
}
