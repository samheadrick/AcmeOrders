const express = require('express');

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);

app.disable('x-powered-by');

const orders = [
  {
    id: 'ord-1001',
    customerName: 'Ada Lovelace',
    status: 'processing',
    total: 129.99,
    createdAt: '2026-08-20T10:30:00.000Z'
  },
  {
    id: 'ord-1002',
    customerName: 'Grace Hopper',
    status: 'shipped',
    total: 84.5,
    createdAt: '2026-08-21T14:15:00.000Z'
  },
  {
    id: 'ord-1003',
    customerName: 'Ada Lovelace',
    status: 'delivered',
    total: 42,
    createdAt: '2026-08-22T09:00:00.000Z'
  }
];

app.use(express.json());

app.get('/health', (request, response) => {
  response.json({ status: 'ok' });
});

app.get('/orders/search', (request, response) => {
  const customerName = typeof request.query.customerName === 'string'
    ? request.query.customerName.trim()
    : '';

  if (!customerName) {
    return response.status(400).json({
      error: 'customerName query parameter is required'
    });
  }

  const normalizedQuery = customerName.toLocaleLowerCase();
  const matches = orders.filter((order) =>
    order.customerName.toLocaleLowerCase().includes(normalizedQuery)
  );

  return response.json({
    data: matches,
    count: matches.length
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Acme Orders API listening on port ${port}`);
  });
}

module.exports = app;
