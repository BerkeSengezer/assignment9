# Reading List

A small React app for keeping track of books, backed by an Express 5 API. The server starts with six books and keeps changes in memory while it runs.

## Start the app

Use Node.js 24 LTS. Open two terminals in the project directory.

```sh
cd server
npm ci
npm start
```

```sh
cd client
npm ci
cp .env.example .env
npm run dev
```

Open http://localhost:5173. The server uses port 3000 by default. Set `PORT` to use another port and `CLIENT_ORIGIN` to allow a different client origin. Set the server's base URL in `client/.env` as `VITE_API_URL` and restart Vite after changing it. The server also supports `npm run dev` for watch mode, and the client supports `npm run build`.

## Project files

- `server/index.js` registers Express routes, CORS and error middleware.
- `server/book.js` validates book input and route IDs.
- `server/booksStore.js` owns the initial books, ID generation, and asynchronous reads and writes.
- `server/bookQuery.js` handles list filtering, ordering and pagination.
- `client/src/App.jsx` coordinates requests and page state. The form, filters, book rows and statistics have their own components.
- `client/src/api/books.js` builds request URLs and handles Fetch responses.

`GET /api/crash` is an intentional demo endpoint for the async error handler. It logs a server error and returns a generic JSON 500.

## Reasoning

1. **Parameters.** Putting the ID in `/api/books/7` gives a specific book its own resource URL. Genre and sort control how the collection is returned, so they fit in its query string. With ID in the query string the collection handler would have to decide whether to return one book or a list.
2. **Body parsing.** In a test copy, moving `express.json()` below the book routes made `req.body` undefined. A POST with a valid JSON body returned 400 because the route reached validation before the JSON middleware ran.
3. **One response.** Removing the return before the early 404 in the single-book route still gave curl a 404. The server then logged `ERR_HTTP_HEADERS_SENT`, because execution fell through and attempted to send the success response too.
4. **PUT and PATCH.** The edit form uses PUT because it supplies the entire replacement, including the book's reading status and rating. The rating control uses PATCH because the title, author, and other stored fields can stay as they are.
5. **CORS.** With the client on port 5182 and the server configured to allow port 5999, the app showed `Failed to fetch`. Server logs show that the GET reached Express and returned 200 with an origin header for port 5999. Curl read that same response because it does not enforce browser CORS rules. The browser UI was observed directly, while its console diagnostic was not captured.
6. **Validation.** Browser controls help users catch mistakes, but requests can also come from curl or from a modified client. The server has to check every request to enforce the same rules regardless of its source.
7. **State.** After adding a book and restarting Express, the stats showed the original six books and the added ID returned 404. The server data is stored in the process's memory and would need persistent storage to survive a restart.

## Self-study

- `URLSearchParams` encodes reserved characters in search values. The client builds query strings with it so a title containing an ampersand does not become an extra query parameter. [MDN URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- `localeCompare` supplies the negative, zero or positive result needed by the sort callback. The API uses it for titles and authors and subtracts numeric values for years and ratings. [MDN localeCompare](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare)
- Vite exposes client variables through `import.meta.env` when their names begin with `VITE_`. The API base URL is public configuration and is safe to expose. [Vite environment variables](https://vite.dev/guide/env-and-mode)
- Express can finish an empty response with `res.end()`. The delete route sets status 204 first and sends no JSON body. [Express response API](https://expressjs.com/en/5x/api.html#res.end)
- Fetch accepts an `AbortSignal`. The effects abort obsolete requests during cleanup and ignore `AbortError` so an old search result cannot overwrite a newer one. [MDN Fetch cancellation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request)

## Challenges

An unread book cannot retain a rating. The app sends the unread flag and a null rating in one PATCH, and the server checks the merged record before saving. Rating sort also handles nulls before applying ascending or descending order so unrated books stay at the end in both directions.

## Browser preflight

With the React client on port 5181 and the API on port 3141, submitting the add form produced an `OPTIONS /api/books` entry before the JSON POST. The headers below were recorded at the server from that browser request. This is the exchange to inspect under DevTools → Network when repeating the test.

| Direction | Header or status | Observed value |
| --- | --- | --- |
| Request | Origin | `http://localhost:5181` |
| Request | Access-Control-Request-Method | `POST` |
| Request | Access-Control-Request-Headers | `content-type` |
| Response | Status | `204 No Content` |
| Response | Access-Control-Allow-Origin | `http://localhost:5181` |
| Response | Access-Control-Allow-Methods | `GET,HEAD,PUT,PATCH,POST,DELETE` |
| Response | Access-Control-Allow-Headers | `content-type` |
| Response | Vary | `Origin, Access-Control-Request-Headers` |

Browser checks covered a duplicate error, adding, marking a book read, rating it, editing it, finding it by search and deleting it. The deleted book's search then showed the empty state.

## Curl results

The responses below were captured with a fresh server configured with `PORT=3140`. The final POST creates the book used for the restart experiment.

```text
$ curl --include --silent --show-error -X GET 'http://localhost:3140/api/books?genre=fantasy&sort=rating&order=desc'
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 236
ETag: W/"ec-Thwmqbb3GHPhy3D8TA26N6/QA9Q"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

[{"id":2,"title":"The Fellowship of the Ring","author":"J.R.R. Tolkien","year":1954,"genre":"fantasy","read":true,"rating":5},{"id":6,"title":"Piranesi","author":"Susanna Clarke","year":2020,"genre":"fantasy","read":true,"rating":null}]

$ curl --include --silent --show-error -X GET http://localhost:3140/api/books/1
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 108
ETag: W/"6c-HVxCf+GiVN1rN/GzYwaV2bOVceM"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":1,"title":"Frankenstein","author":"Mary Shelley","year":1818,"genre":"fiction","read":true,"rating":4}

$ curl --include --silent --show-error -X GET http://localhost:3140/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 111
ETag: W/"6f-p4+FICCHeBRXaZG8B9DdQQXfZJk"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":6,"read":3,"unread":3,"averageRating":4.5,"byGenre":{"fiction":2,"fantasy":2,"science":1,"history":1}}

$ curl --include --silent --show-error -X POST -H 'Content-Type: application/json' --data '{"title":"The Dispossessed","author":"Ursula K. Le Guin","year":1974,"genre":"fiction"}' http://localhost:3140/api/books
HTTP/1.1 201 Created
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Location: /api/books/7
Content-Type: application/json; charset=utf-8
Content-Length: 121
ETag: W/"79-auKgQ9aLTp2qBfOQx2ZBLTalZXc"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"read":false,"rating":null,"title":"The Dispossessed","author":"Ursula K. Le Guin","year":1974,"genre":"fiction","id":7}

$ curl --include --silent --show-error -X POST -H 'Content-Type: application/json' --data '{"title":"Invalid","author":"Test","year":500,"genre":"fiction"}' http://localhost:3140/api/books
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 53
ETag: W/"35-ADNQzWn8/THdZlEouaY9TSKAcq4"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"year must be an integer from 1000 to 2026"}

$ curl --include --silent --show-error -X GET 'http://localhost:3140/api/books?genre=fiction&genre=history'
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 31
ETag: W/"1f-P/KMzIWx8LP9OUmqG3ig+F+IFN8"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Use genre only once"}

$ curl --include --silent --show-error -X GET http://localhost:3140/api/books/999
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 26
ETag: W/"1a-9K7Ys+5Z9m3qczPTmMk82VGBL7g"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book not found"}

$ curl --include --silent --show-error -X POST -H 'Content-Type: application/json' --data '{"title":"the dispossessed","author":"ursula k. le guin","year":1974,"genre":"fiction"}' http://localhost:3140/api/books
HTTP/1.1 409 Conflict
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 60
ETag: W/"3c-YJy0XpDp5agPe/8cl8QkvyagI8A"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"A book with this title and author already exists"}

$ curl --include --silent --show-error -X PUT -H 'Content-Type: application/json' --data '{"title":"The Dispossessed","author":"Ursula K. Le Guin","year":1974,"genre":"fiction","read":true}' http://localhost:3140/api/books/7
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 120
ETag: W/"78-VTFT8mStPdQeAf1rgZHY4/YK/9c"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"read":true,"rating":null,"title":"The Dispossessed","author":"Ursula K. Le Guin","year":1974,"genre":"fiction","id":7}

$ curl --include --silent --show-error -X PATCH -H 'Content-Type: application/json' --data '{"rating":5}' http://localhost:3140/api/books/7
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 117
ETag: W/"75-sThLGDqZbOZs47/xKbF/BywVFww"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"read":true,"rating":5,"title":"The Dispossessed","author":"Ursula K. Le Guin","year":1974,"genre":"fiction","id":7}

$ curl --include --silent --show-error -X GET http://localhost:3140/api/stats
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 111
ETag: W/"6f-FQ9JeYOICHWdYFh+kSRQseV0wg8"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"total":7,"read":4,"unread":3,"averageRating":4.7,"byGenre":{"fiction":3,"fantasy":2,"science":1,"history":1}}

$ curl --include --silent --show-error -X DELETE http://localhost:3140/api/books/7
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl --include --silent --show-error -X DELETE http://localhost:3140/api/books/7
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 26
ETag: W/"1a-9K7Ys+5Z9m3qczPTmMk82VGBL7g"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Book not found"}

$ curl --include --silent --show-error -X POST -H 'Content-Type: application/json' --data '{"title":' http://localhost:3140/api/books
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 39
ETag: W/"27-iScL7ZTdBPaDlOBzvqeMTDqAIXw"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Malformed JSON request body"}

$ curl --include --silent --show-error -X GET http://localhost:3140/api/missing
HTTP/1.1 404 Not Found
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 21
ETag: W/"15-bm7tJgu8FHlq5QU+Y6gDxOGPfRc"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Not found"}

$ curl --include --silent --show-error -X GET http://localhost:3140/api/crash
HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 32
ETag: W/"20-cI8B1wZuBEyTE5ClDvphKZx7wd0"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Something went wrong"}

$ curl --include --silent --show-error -X GET http://localhost:3140/api/books/-1
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 41
ETag: W/"29-eiZTR092ClXGPeHi/BDwiytO0ew"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"id must be a positive integer"}

$ curl --include --silent --show-error -X PATCH -H 'Content-Type: application/json' --data '{"rating":5}' http://localhost:3140/api/books/3
HTTP/1.1 400 Bad Request
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Content-Type: application/json; charset=utf-8
Content-Length: 45
ETag: W/"2d-oU59gNKsHdAYUZ2S7o6LthNpwEo"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"error":"Only read books can have a rating"}

$ curl --include --silent --show-error -X OPTIONS -H 'Origin: http://localhost:5173' -H 'Access-Control-Request-Method: POST' -H 'Access-Control-Request-Headers: content-type' http://localhost:3140/api/books
HTTP/1.1 204 No Content
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin, Access-Control-Request-Headers
Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE
Access-Control-Allow-Headers: content-type
Content-Length: 0
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

$ curl --include --silent --show-error -X POST -H 'Content-Type: application/json' --data '{"title":"The Dispossessed","author":"Ursula K. Le Guin","year":1974,"genre":"fiction"}' http://localhost:3140/api/books
HTTP/1.1 201 Created
X-Powered-By: Express
Access-Control-Allow-Origin: http://localhost:5173
Vary: Origin
Location: /api/books/8
Content-Type: application/json; charset=utf-8
Content-Length: 121
ETag: W/"79-851fQpzD+dRTTLUjnYYZuWEqOVk"
Date: Tue, 24 Nov 2026 23:51:23 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"read":false,"rating":null,"title":"The Dispossessed","author":"Ursula K. Le Guin","year":1974,"genre":"fiction","id":8}

```
