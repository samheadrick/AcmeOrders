const express = require('express');
const { createOrder, searchOrders, updateOrderNote } = require('./database');
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

app.post('/orders/import', async (request, response) => {
  const { url } = request.body || {};
  let partnerUrl;

  try {
    partnerUrl = new URL(url);
    if (!['http:', 'https:'].includes(partnerUrl.protocol)) throw new Error();
  } catch {
    return response.status(400).json({ error: 'url must be a valid HTTP or HTTPS URL' });
  }

  let partnerResponse;
  try {
    partnerResponse = await fetch(partnerUrl, { signal: AbortSignal.timeout(5000) });
  } catch {
    return response.status(502).json({ error: 'unable to fetch partner order' });
  }

  if (!partnerResponse.ok) {
    return response.status(502).json({ error: 'partner order returned an error' });
  }

  let document;
  try {
    document = await partnerResponse.json();
  } catch {
    return response.status(422).json({ error: 'partner response must be valid JSON' });
  }

  const order = document && typeof document.order === 'object' ? document.order : document;
  const hasRequiredFields = order &&
    typeof order.customerName === 'string' && order.customerName.trim() &&
    typeof order.status === 'string' && order.status.trim() &&
    typeof order.total === 'number' && Number.isFinite(order.total) &&
    typeof order.createdAt === 'string' && !Number.isNaN(Date.parse(order.createdAt));

  if (!hasRequiredFields) {
    return response.status(422).json({
      error: 'partner order must contain customerName, status, total, and a valid createdAt'
    });
  }

  try {
    const importedOrder = createOrder({
      id: typeof order.id === 'string' && order.id.trim() ? order.id.trim() : undefined,
      customerName: order.customerName.trim(),
      status: order.status.trim(),
      total: order.total,
      createdAt: order.createdAt,
      notes: typeof order.notes === 'string' ? order.notes : ''
    });
    return response.status(201).json({ data: importedOrder });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return response.status(409).json({ error: 'order already exists' });
    }
    throw error;
  }
});

app.patch('/orders/:orderId/note', (request, response) => {
  const { orderId } = request.params;
  const { notes } = request.body || {};

  if (typeof notes !== 'string') {
    return response.status(400).json({ error: 'notes must be a string' });
  }

  const order = updateOrderNote(orderId, notes.trim());
  if (!order) {
    return response.status(404).json({ error: 'order not found' });
  }

  return response.json({ data: order });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Acme Orders API listening on port ${port}`);
  });
}

module.exports = app;
