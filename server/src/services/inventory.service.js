const prisma = require("../prisma");

class InventoryService {
  async createMovement({ product_id, quantity, type, reference }, tx = prisma) {
    if (!product_id || !quantity || !type) {
      const error = new Error("product_id, quantity, and type are required for stock movement");
      error.statusCode = 400;
      throw error;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      const error = new Error("Stock movement quantity must be a positive number");
      error.statusCode = 400;
      throw error;
    }

    const product = await tx.product.findUnique({ where: { id: product_id } });
    if (!product) {
      const error = new Error("Product not found");
      error.statusCode = 404;
      throw error;
    }

    // Only GOODS products have stock tracking
    if (product.type !== "GOODS") {
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

  /**
   * Retrieves the current stock for one or all GOODS products.
   * Uses Prisma groupBy to efficiently calculate the net stock.
   */
  async getCurrentStock(productId = null) {
    const whereCondition = { type: "GOODS" };
    if (productId) {
      whereCondition.id = productId;
    }

    const goodsProducts = await prisma.product.findMany({
      where: whereCondition,
    });

    if (productId && goodsProducts.length === 0) {
      const error = new Error("Product not found or not a GOODS product");
      error.statusCode = 404;
      throw error;
    }

    const productIds = goodsProducts.map((p) => p.id);

    const movements = await prisma.stockMovement.groupBy({
      by: ["product_id", "type"],
      _sum: { quantity: true },
      where: { product_id: { in: productIds } },
    });

    const stockMap = {};
    for (const m of movements) {
      if (!stockMap[m.product_id]) stockMap[m.product_id] = 0;
      const qty = m._sum.quantity || 0;
      if (m.type === "PURCHASE" || m.type === "ADJUSTMENT") {
        stockMap[m.product_id] += qty;
      } else if (m.type === "SALE") {
        stockMap[m.product_id] -= qty;
      }
    }

    const results = goodsProducts.map((product) => {
      let current_stock = stockMap[product.id] || 0;
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
      return results[0];
    }

    return results;
  }

  /**
   * Retrieves all stock movements.
   */
  async getMovements() {
    return await prisma.stockMovement.findMany({
      orderBy: { created_at: "desc" },
      include: { product: true },
    });
  }

  /**
   * Validates if there's enough stock available for the requested lines.
   */
  async checkStockAvailability(lines, tx = prisma) {
    const productIds = lines.map((l) => l.product_id);
    if (productIds.length === 0) return;

    const products = await tx.product.findMany({
      where: { id: { in: productIds }, type: "GOODS" },
    });

    if (products.length === 0) return;

    const validProductIds = products.map((p) => p.id);

    const movements = await tx.stockMovement.groupBy({
      by: ["product_id", "type"],
      _sum: { quantity: true },
      where: { product_id: { in: validProductIds } },
    });

    const stockMap = {};
    for (const m of movements) {
      if (!stockMap[m.product_id]) stockMap[m.product_id] = 0;
      const qty = m._sum.quantity || 0;
      if (m.type === "PURCHASE" || m.type === "ADJUSTMENT") {
        stockMap[m.product_id] += qty;
      } else if (m.type === "SALE") {
        stockMap[m.product_id] -= qty;
      }
    }

    for (const line of lines) {
      const product = products.find((p) => p.id === line.product_id);
      if (product) {
        let currentStock = stockMap[product.id] || 0;
        const required = parseFloat(line.qty) || 0;

        if (currentStock < required) {
          console.warn(
            `Hackathon Mode: Allowing negative stock for '${product.name}'. Available: ${currentStock}, Required: ${required}`
          );
          // const error = new Error(
          //   `Insufficient stock for product '${product.name}'. Available: ${currentStock}, Required: ${required}`,
          // );
          // error.statusCode = 400;
          // throw error;
        }
      }
    }
  }
}

module.exports = new InventoryService();
