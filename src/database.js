const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const dataDirectory = path.join(__dirname, '..', 'data');
const databasePath = path.join(dataDirectory, 'orders.db');

fs.mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(databasePath);

database.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL,
    total REAL NOT NULL,
    created_at TEXT NOT NULL
  )
`);

const orderCount = database.prepare('SELECT COUNT(*) AS count FROM orders').get().count;

if (orderCount === 0) {
  const insertOrder = database.prepare(`
    INSERT INTO orders (id, customer_name, status, total, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const sampleOrders = [
    ['ord-1001', 'Ada Lovelace', 'processing', 129.99, '2026-08-20T10:30:00.000Z'],
    ['ord-1002', 'Grace Hopper', 'shipped', 84.5, '2026-08-21T14:15:00.000Z'],
    ['ord-1003', 'Ada Lovelace', 'delivered', 42, '2026-08-22T09:00:00.000Z']
  ];

  database.exec('BEGIN');
  try {
    for (const order of sampleOrders) {
      insertOrder.run(...order);
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function escapeLikePattern(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

function searchOrders(customerName) {
  const searchPattern = escapeLikePattern(customerName);
  const rows = database.prepare(`
    SELECT
      id,
      customer_name AS customerName,
      status,
      total,
      created_at AS createdAt
    FROM orders
    WHERE LOWER(customer_name) LIKE '%' || LOWER(?) || '%' ESCAPE char(92)
    ORDER BY created_at ASC
  `).all(searchPattern);

  return rows;
}

module.exports = { searchOrders };