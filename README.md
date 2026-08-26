# Acme Orders API

A small Node.js and Express API backed by SQLite for searching orders by customer name.

## Run

```sh
npm install
npm start
```

The server listens on `http://localhost:3000` by default. Set `PORT` to use a different port.
The SQLite database is created at `data/orders.db` and is seeded with sample orders on first run.

## Endpoint

`GET /orders/search?customerName=<name>` performs a case-insensitive partial match and returns the matching orders:

```json
{
  "data": [],
  "count": 0
}
```

`customerName` is required. Missing or blank values return `400`.

`PATCH /orders/:orderId/note` updates an order note with a JSON body:

```json
{
  "notes": "Call customer before shipping"
}
```

The updated note is returned in `data` and included in subsequent search results.

`POST /orders/import` fetches and imports a partner order document with a JSON body:

```json
{
  "url": "https://partner.example/orders/42"
}
```

The partner response may contain the order at the top level or under an `order` property. It must include `customerName`, `status`, `total`, and a valid `createdAt` value. An order ID is generated when the partner does not provide one.
Imports are restricted to exact hostnames in the comma-separated `PARTNER_HOSTS` environment variable. The default approved host is `partner.example`.

## Test

```sh
npm test
```
