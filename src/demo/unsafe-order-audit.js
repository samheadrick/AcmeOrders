'use strict';

// INTENTIONALLY VULNERABLE DEMO (CWE-89).
// This file is for static analysis only; it is not wired into the running API.
// A real database connection is deliberately not configured.

function buildAuditStatement(customerName, action) {
  const auditMessage = action + ' requested for customer ' + customerName;
  return "INSERT INTO order_audit (event_type, message) VALUES ('lookup', '" +
    auditMessage + "')";
}

async function writeOrderAudit(db, customerName, action) {
  const sql = buildAuditStatement(customerName, action);
  // UNSAFE SINK: externally supplied customerName reaches SQL execution.
  return db.query(sql);
}

function registerAuditRoutes(app, db) {
  app.post('/orders/audit', async (req, res) => {
    const customerName = req.body.customerName;
    const action = req.body.action || 'search';
    try {
      await writeOrderAudit(db, customerName, action);
      return res.status(202).json({ status: 'recorded' });
    } catch (error) {
      return res.status(500).json({ error: 'audit logging failed' });
    }
  });
}

module.exports = { buildAuditStatement, writeOrderAudit, registerAuditRoutes };
