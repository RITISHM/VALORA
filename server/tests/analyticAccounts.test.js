const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/prisma');

// Mock Prisma
jest.mock('../src/prisma', () => {
  let mockStore = [];

  return {
    analyticAccount: {
      create: jest.fn(async ({ data }) => {
        const newRecord = {
          id: `uuid-${Date.now()}-${Math.random()}`,
          name: data.name,
          type: data.type,
        };
        mockStore.push(newRecord);
        return newRecord;
      }),
      findMany: jest.fn(async ({ orderBy }) => {
        const records = [...mockStore];
        if (orderBy?.name === 'asc') {
          records.sort((a, b) => a.name.localeCompare(b.name));
        }
        return records;
      }),
      findUnique: jest.fn(async ({ where, include }) => {
        const record = mockStore.find((r) => r.id === where.id);
        if (!record) return null;
        if (include?._count) {
          return {
            ...record,
            _count: record._count || {
              budget_lines: 0,
              purchase_order_lines: 0,
              vendor_bill_lines: 0,
              sales_order_lines: 0,
              customer_invoice_lines: 0,
            },
          };
        }
        return record;
      }),
      update: jest.fn(async ({ where, data }) => {
        const index = mockStore.findIndex((r) => r.id === where.id);
        if (index === -1) return null;
        mockStore[index] = { ...mockStore[index], ...data };
        return mockStore[index];
      }),
      delete: jest.fn(async ({ where }) => {
        const index = mockStore.findIndex((r) => r.id === where.id);
        if (index === -1) return null;
        const [deleted] = mockStore.splice(index, 1);
        return deleted;
      }),

      _setMockStore: (store) => {
        mockStore = store;
      },
      _getMockStore: () => mockStore,
    },
  };
});

describe('Analytic Accounts API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.analyticAccount._setMockStore([]);
  });

  describe('POST /analytic-accounts (Create)', () => {
    it('1. should create a valid INCOME analytic account', async () => {
      const res = await request(app)
        .post('/analytic-accounts')
        .send({ name: '  Project Alpha  ', type: 'INCOME' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Project Alpha');
      expect(res.body.type).toBe('INCOME');
    });

    it('2. should create a valid EXPENSE analytic account', async () => {
      const res = await request(app)
        .post('/analytic-accounts')
        .send({ name: 'Marketing Dept', type: 'EXPENSE' });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Marketing Dept');
      expect(res.body.type).toBe('EXPENSE');
    });

    it('3. should reject when name is missing', async () => {
      const res = await request(app)
        .post('/analytic-accounts')
        .send({ type: 'INCOME' });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('4. should reject when name is empty or whitespace only', async () => {
      const res = await request(app)
        .post('/analytic-accounts')
        .send({ name: '   ', type: 'INCOME' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/empty/i);
    });

    it('5. should reject when type is invalid', async () => {
      const res = await request(app)
        .post('/analytic-accounts')
        .send({ name: 'Project Beta', type: 'INVALID_TYPE' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/(INCOME|EXPENSE)/i);
    });
  });

  describe('GET /analytic-accounts (Get All)', () => {
    it('6. should return all analytic accounts sorted by name', async () => {
      prisma.analyticAccount._setMockStore([
        { id: '1', name: 'Zebra Project', type: 'EXPENSE' },
        { id: '2', name: 'Alpha Project', type: 'INCOME' },
      ]);

      const res = await request(app).get('/analytic-accounts');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].name).toBe('Alpha Project');
      expect(res.body[1].name).toBe('Zebra Project');
    });
  });

  describe('GET /analytic-accounts/:id (Get By ID)', () => {
    it('7. should return existing account by ID', async () => {
      prisma.analyticAccount._setMockStore([
        { id: 'acc-123', name: 'Project Gamma', type: 'INCOME' },
      ]);

      const res = await request(app).get('/analytic-accounts/acc-123');

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe('acc-123');
      expect(res.body.name).toBe('Project Gamma');
    });

    it('8. should return 404 for non-existing ID', async () => {
      const res = await request(app).get('/analytic-accounts/non-existing-id');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('PUT /analytic-accounts/:id (Update)', () => {
    it('9. should update name of existing account', async () => {
      prisma.analyticAccount._setMockStore([
        { id: 'acc-456', name: 'Old Name', type: 'EXPENSE' },
      ]);

      const res = await request(app)
        .put('/analytic-accounts/acc-456')
        .send({ name: 'New Name', type: 'EXPENSE' });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('10. should update type of existing account', async () => {
      prisma.analyticAccount._setMockStore([
        { id: 'acc-456', name: 'Project Delta', type: 'EXPENSE' },
      ]);

      const res = await request(app)
        .put('/analytic-accounts/acc-456')
        .send({ name: 'Project Delta', type: 'INCOME' });

      expect(res.statusCode).toBe(200);
      expect(res.body.type).toBe('INCOME');
    });

    it('11. should return 404 when updating non-existing ID', async () => {
      const res = await request(app)
        .put('/analytic-accounts/non-existing-id')
        .send({ name: 'Test', type: 'INCOME' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('DELETE /analytic-accounts/:id (Delete)', () => {
    it('12. should delete unreferenced existing record', async () => {
      prisma.analyticAccount._setMockStore([
        {
          id: 'acc-789',
          name: 'To Delete',
          type: 'EXPENSE',
          _count: {
            budget_lines: 0,
            purchase_order_lines: 0,
            vendor_bill_lines: 0,
            sales_order_lines: 0,
            customer_invoice_lines: 0,
          },
        },
      ]);

      const res = await request(app).delete('/analytic-accounts/acc-789');

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/deleted/i);
      expect(prisma.analyticAccount._getMockStore().length).toBe(0);
    });

    it('13. should return 404 when deleting non-existing ID', async () => {
      const res = await request(app).delete('/analytic-accounts/non-existing-id');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    it('14. should block deletion when record is referenced in transactions/budgets', async () => {
      prisma.analyticAccount._setMockStore([
        {
          id: 'acc-referenced',
          name: 'Referenced Account',
          type: 'EXPENSE',
          _count: {
            budget_lines: 1,
            purchase_order_lines: 0,
            vendor_bill_lines: 0,
            sales_order_lines: 0,
            customer_invoice_lines: 0,
          },
        },
      ]);

      const res = await request(app).delete('/analytic-accounts/acc-referenced');

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/referenced/i);
      expect(prisma.analyticAccount._getMockStore().length).toBe(1);
    });
  });
});
