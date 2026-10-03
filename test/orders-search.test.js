const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

test('serves the browser frontend and its assets', async () => {
  const page = await request(app).get('/');
  const stylesheet = await request(app).get('/styles.css');
  const script = await request(app).get('/app.js');

  assert.equal(page.status, 200);
  assert.match(page.text, /<title>Acme Orders<\/title>/);
  assert.match(page.text, /id="search-form"/);
  assert.match(page.text, /id="create-form"/);
  assert.match(page.text, /id="create-dialog"/);
  assert.match(page.text, /Create Order/);
  assert.match(page.text, /Order ID/);
  assert.equal(stylesheet.status, 200);
  assert.match(stylesheet.text, /--accent/);
  assert.equal(script.status, 200);
  assert.match(script.text, /\/orders\/search/);
  assert.match(script.text, /\/orders\/import/);
  assert.match(script.text, /fetch\('\/orders'/);
  assert.match(script.text, /loadOrders\(activeSearch\)/);
  assert.match(script.text, /createDialog\.showModal\(\)/);
  assert.match(script.text, /formatNote/);
  assert.match(script.text, /noopener noreferrer/);
});

test('creates an order with a generated ID and persists it', async () => {
  const customerName = `New Customer ${Date.now()}`;
  const result = await request(app)
    .post('/orders')
    .send({
      customerName,
      status: 'pending',
      total: 18.75,
      createdAt: '2026-08-26T15:00:00.000Z',
      notes: 'Created from the UI'
    });

  assert.equal(result.status, 201);
  assert.match(result.body.data.id, /^ord-/);
  assert.equal(result.body.data.customerName, customerName);
  assert.equal(result.body.data.notes, 'Created from the UI');

  const search = await request(app).get(`/orders/search?customerName=${encodeURIComponent(customerName)}`);
  assert.equal(search.body.count, 1);
  assert.equal(search.body.data[0].id, result.body.data.id);
});

test('rejects invalid create-order fields', async () => {
  const result = await request(app)
    .post('/orders')
    .send({ customerName: 'Invalid Order', status: 'pending', total: 'not-a-number', createdAt: 'not-a-date' });

  assert.equal(result.status, 400);
});

test('rejects an empty order total', async () => {
  const result = await request(app)
    .post('/orders')
    .send({ customerName: 'Blank Total', status: 'pending', total: '', createdAt: '2026-08-26T15:00:00.000Z' });

  assert.equal(result.status, 400);
});

test('imports and persists a valid partner order', async () => {
  const customerName = `Katherine ${Date.now()}`;
  const orderId = `partner-${Date.now()}`;
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      id: orderId,
      customerName,
      status: 'pending',
      total: 73.25,
      createdAt: '2026-08-24T12:00:00.000Z'
    })
  });

  try {
    const result = await request(app)
      .post('/orders/import')
      .send({ url: 'https://partner.example/orders/42' });

    assert.equal(result.status, 201);
    assert.equal(result.body.data.customerName, customerName);
    const search = await request(app).get(`/orders/search?customerName=${encodeURIComponent(customerName)}`);
    assert.equal(search.body.data.find((order) => order.id === orderId).customerName, customerName);
  } finally {
    global.fetch = originalFetch;
  }
});

test('rejects partner orders missing required fields', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ customerName: 'Incomplete' }) });

  try {
    const result = await request(app)
      .post('/orders/import')
      .send({ url: 'https://partner.example/orders/invalid' });
    assert.equal(result.status, 422);
  } finally {
    global.fetch = originalFetch;
  }
});

test('rejects non-HTTP import URLs', async () => {
  const result = await request(app)
    .post('/orders/import')
    .send({ url: 'file:///tmp/order.json' });

  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'url must be a valid HTTP or HTTPS URL');
});

test('searches orders by customer name case-insensitively', async () => {
  const result = await request(app).get('/orders/search?customerName=ada');

  assert.equal(result.status, 200);
  assert.equal(result.body.count, 2);
  assert.deepEqual(result.body.data.map((order) => order.id), ['ord-1001', 'ord-1003']);
});

test('updates and persists an order note', async () => {
  const note = `Follow up ${Date.now()}`;
  const update = await request(app)
    .patch('/orders/ord-1001/note')
    .send({ notes: note });

  assert.equal(update.status, 200);
  assert.equal(update.body.data.notes, note);

  const search = await request(app).get('/orders/search?customerName=ada');
  assert.equal(search.body.data.find((order) => order.id === 'ord-1001').notes, note);
});

test('rejects invalid order note updates', async () => {
  const result = await request(app)
    .patch('/orders/ord-1001/note')
    .send({ notes: 123 });

  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'notes must be a string');
});

test('rejects a search without a customer name', async () => {
  const result = await request(app).get('/orders/search');

  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'customerName query parameter is required');
});
