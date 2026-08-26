const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

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
