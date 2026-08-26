# Acme Orders API

A small Node.js and Express API for searching orders by customer name.

## Run

```sh
npm install
npm start
```

The server listens on `http://localhost:3000` by default. Set `PORT` to use a different port.

## Endpoint

`GET /orders/search?customerName=<name>` performs a case-insensitive partial match and returns the matching orders:

```json
{
  "data": [],
  "count": 0
}
```

`customerName` is required. Missing or blank values return `400`.

## Test

```sh
npm test
```
