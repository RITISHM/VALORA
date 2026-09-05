const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('Tax, Inventory, and Contact Portal Requirements', () => {
  const validContactId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const validProductId = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

  const contactToken = jwt.sign(
    { id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', role: 'CONTACT', contact_id: validContactId },
    process.env.JWT_SECRET || 'your_jwt_secret_key'
  );

  const adminToken = jwt.sign(
    { id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', role: 'ADMIN' },
    process.env.JWT_SECRET || 'your_jwt_secret_key'
  );

  describe('PART 1 — TAX', () => {
    it('should reject negative tax rate on sales order creation', async () => {
      const res = await request(app)
        .post('/sales-orders')
        .send({
          customer_id: validContactId,
          lines: [
            { product_id: validProductId, qty: 2, unit_price: 100, tax_rate: -5 },
          ],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/tax rate/i);
    });

    it('should reject negative tax rate on customer invoice creation', async () => {
      const res = await request(app)
        .post('/customer-invoices')
        .send({
          customer_id: validContactId,
          lines: [
            { product_id: validProductId, qty: 1, unit_price: 200, tax_rate: -18 },
          ],
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/tax rate/i);
    });
  });

  describe('PART 2 — INVENTORY / STOCK', () => {
    it('should return stock list from GET /inventory/stock', async () => {
      const res = await request(app).get('/inventory/stock');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return movements from GET /inventory/movements', async () => {
      const res = await request(app).get('/inventory/movements');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('PART 3 — CONTACT USER PORTAL & SECURITY', () => {
    it('should deny portal access without token', async () => {
      const res = await request(app).get('/portal/invoices');
      expect(res.statusCode).toBe(401);
    });

    it('should deny portal access to non-CONTACT roles', async () => {
      const res = await request(app)
        .get('/portal/invoices')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should allow portal access to authenticated CONTACT user', async () => {
      const res = await request(app)
        .get('/portal/invoices')
        .set('Authorization', `Bearer ${contactToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should calculate contact outstanding dues', async () => {
      const res = await request(app)
        .get('/portal/outstanding')
        .set('Authorization', `Bearer ${contactToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('total_unpaid_invoices');
      expect(res.body).toHaveProperty('total_unpaid_bills');
      expect(res.body).toHaveProperty('net_outstanding');
    });

    it('should prevent portal user from paying another contact\'s invoice', async () => {
      const nonExistentInvoiceId = 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66';
      const res = await request(app)
        .post(`/portal/invoices/${nonExistentInvoiceId}/pay`)
        .set('Authorization', `Bearer ${contactToken}`)
        .send({ method: 'BANK', amount: 100 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/not found|access denied/i);
    });
  });
});
