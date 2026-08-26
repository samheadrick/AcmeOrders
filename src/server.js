const express = require('express');
const { searchOrders } = require('./database');
const path = require('node:path');

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);

app.disable('x-powered-by');

app.use(express.static(path.join(__dirname, '..', 'public')));

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

  const matches = searchOrders(customerName);

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
