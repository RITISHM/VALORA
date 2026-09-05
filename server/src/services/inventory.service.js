const prisma = require('../prisma');

class InventoryService {
  async createMovement({ product_id, quantity, type, reference }, tx = prisma) {
    if (!product_id || !quantity || !type) {
      const error = new Error('product_id, quantity, and type are required for stock movement');
      error.statusCode = 400;
      throw error;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      const error = new Error('Stock movement quantity must be a positive number');
      error.statusCode = 400;
      throw error;
    }

    const product = await tx.product.findUnique({ where: { id: product_id } });
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }

    // Only GOODS products have stock tracking
    if (product.type !== 'GOODS') {
      return null;
    }

    return await tx.stockMovement.create({
      data: {
        product_id,
        quantity: qty,
        type,
        reference: reference || null,
      },
      include: {
        product: true,
      },
    });
  }

  async getCurrentStock(productId = null) {
    const whereCondition = { type: 'GOODS' };
    if (productId) {
      whereCondition.id = productId;
    }

    const goodsProducts = await prisma.product.findMany({
      where: whereCondition,
      include: {
        stock_movements: true,
      },
    });

    const results = goodsProducts.map((product) => {
      let current_stock = 0;
      for (const m of product.stock_movements) {
        if (m.type === 'PURCHASE' || m.type === 'ADJUSTMENT') {
          current_stock += m.quantity;
        } else if (m.type === 'SALE') {
          current_stock -= m.quantity;
        }
      }

      current_stock = Math.round(current_stock * 100) / 100;

      return {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        sales_price: product.sales_price,
        cost: product.cost,
        current_stock,
      };
    });

    if (productId) {
      if (results.length === 0) {
        const error = new Error('Product not found or not a GOODS product');
        error.statusCode = 404;
        throw error;
      }
      return results[0];
    }

    return results;
  }

  async getMovements() {
    return await prisma.stockMovement.findMany({
      orderBy: {
        created_at: 'desc',
      },
      include: {
        product: true,
      },
    });
  }

  async checkStockAvailability(lines, tx = prisma) {
    for (const line of lines) {
      const product = await tx.product.findUnique({
        where: { id: line.product_id },
        include: { stock_movements: true },
      });

      if (product && product.type === 'GOODS') {
        let currentStock = 0;
        for (const m of product.stock_movements) {
          if (m.type === 'PURCHASE' || m.type === 'ADJUSTMENT') {
            currentStock += m.quantity;
          } else if (m.type === 'SALE') {
            currentStock -= m.quantity;
          }
        }

        const required = parseFloat(line.qty) || 0;
        if (currentStock < required) {
          const error = new Error(
            `Insufficient stock for product '${product.name}'. Available: ${currentStock}, Required: ${required}`
          );
          error.statusCode = 400;
          throw error;
        }
      }
    }
  }
}

module.exports = new InventoryService();
