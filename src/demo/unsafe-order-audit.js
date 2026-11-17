'use strict';

// INTENTIONALLY VULNERABLE DEMO (CWE-89). DO NOT MERGE OR DEPLOY.
// The HTTP request body reaches a real SQLite execution API via two helpers.
// No persistent database or schema changes are required.

function buildAuditStatement(customerName, action) {
  const auditMessage = action + ' requested for customer ' + customerName;
  return "INSERT INTO order_audit (event_type, message) VALUES ('lookup', '" +
    auditMessage + "')";
}

function writeOrderAudit(db, customerName, action) {
  const sql = buildAuditStatement(customerName, action);
  // UNSAFE: untrusted input is interpolated into SQL before prepare().
  return db.prepare(sql).run();
}

function registerAuditRoutes(app) {
  app.post('/orders/audit', (req, res) => {
    const customerName = req.body?.customerName;
    const action = req.body?.action || 'search';
    if (typeof customerName !== 'string') {
      return res.status(400).json({ error: 'customerName is required' });
    }
    // Node.js built-in SQLite API; opened only when the demo endpoint is called.
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(':memory:');
    try {
      writeOrderAudit(db, customerName, action);
      return res.status(202).json({ status: 'recorded' });
    } catch (error) {
      return res.status(500).json({ error: 'audit logging failed' });
    } finally {
      db.close();
    }
  });
}

module.exports = { buildAuditStatement, writeOrderAudit, registerAuditRoutes };
