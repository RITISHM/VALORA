const prisma = require('../prisma');

class ProductsService {
  async getAllProducts() {
    return await prisma.product.findMany();
  }

  async getProductById(id) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      throw error;
    }
    return product;
  }

  async createProduct(data) {
    return await prisma.product.create({ data });
  }

  async updateProduct(id, data) {
    try {
      return await prisma.product.update({ where: { id }, data });
    } catch (error) {
      if (error.code === 'P2025') {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
      }
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      await prisma.product.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2025') {
        const err = new Error('Product not found');
        err.statusCode = 404;
        throw err;
      }
      throw error;
    }
  }
}

module.exports = new ProductsService();
