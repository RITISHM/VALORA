const request = require('supertest');
const app = require('../src/app');

describe('BE2 Complete Workflows & Engine Integration', () => {
  const nonExistentUUID = 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

  describe('Accounting Engine Service (Double-Entry Validation)', () => {
    it('should reject double-entry imbalance (sum(debit) !== sum(credit))', async () => {
      const res = await request(app)
        .post('/journal-entries')
        .send({
          journalId: nonExistentUUID,
          reference: 'Test Imbalance',
          lines: [
            { accountId: nonExistentUUID, debit: 500, credit: 0 },
            { accountId: nonExistentUUID, debit: 0, credit: 400 },
          ],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/Double-entry imbalance/i);
    });
  });

  describe('Budget Lifecycle API', () => {
    it('should validate missing required fields on budget creation', async () => {
      const res = await request(app)
        .post('/budgets')
        .send({ name: 'Jan 2026' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });
  });

  describe('Sales Workflow API', () => {
    it('should validate missing customer_id on sales order creation', async () => {
      const res = await request(app)
        .post('/sales-orders')
        .send({ lines: [] });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/customer_id/i);
    });

    it('should return 404 for non-existing sales order ID', async () => {
      const res = await request(app).get(`/sales-orders/${nonExistentUUID}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return 404 for non-existing invoice ID', async () => {
      const res = await request(app).get(`/customer-invoices/${nonExistentUUID}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Reports API', () => {
    it('should return balance sheet structure', async () => {
      const res = await request(app).get('/reports/balance-sheet?year=2026');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('assets');
      expect(res.body).toHaveProperty('liabilities');
      expect(res.body).toHaveProperty('capital');
      expect(res.body).toHaveProperty('is_balanced');
    });

    it('should return profit and loss structure', async () => {
      const res = await request(app).get('/reports/profit-and-loss?year=2026');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('income');
      expect(res.body).toHaveProperty('expenses');
      expect(res.body).toHaveProperty('net_profit');
    });

    it('should return budget report structure', async () => {
      const res = await request(app).get('/reports/budget');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('total_budgets');
      expect(res.body).toHaveProperty('lines');
    });
  });
});
