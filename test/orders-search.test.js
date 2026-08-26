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
  assert.match(page.text, /Order ID/);
  assert.equal(stylesheet.status, 200);
  assert.match(stylesheet.text, /--accent/);
  assert.equal(script.status, 200);
  assert.match(script.text, /\/orders\/search/);
});

test('searches orders by customer name case-insensitively', async () => {
  const result = await request(app).get('/orders/search?customerName=ada');

  assert.equal(result.status, 200);
  assert.equal(result.body.count, 2);
  assert.deepEqual(result.body.data.map((order) => order.id), ['ord-1001', 'ord-1003']);
});

test('rejects a search without a customer name', async () => {
  const result = await request(app).get('/orders/search');

  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'customerName query parameter is required');
});
