const productsService = require("../services/products.service");
const { z } = require("zod");

const productSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["GOODS", "SERVICE", "COMBO"]),
  category: z.string().optional().nullable(),
  sales_price: z.number().min(0).default(0.0),
  cost: z.number().min(0).default(0.0),
});

class ProductsController {
  async getAllProducts(req, res, next) {
    try {
      const products = await productsService.getAllProducts();
      return res.status(200).json(products);
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productsService.getProductById(req.params.id);
      return res.status(200).json(product);
    } catch (err) {
      next(err);
    }
  }

  async createProduct(req, res, next) {
    try {
      const validatedData = productSchema.parse(req.body);
      const product = await productsService.createProduct(validatedData);
      return res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors });
      }
      next(err);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const validatedData = productSchema.parse(req.body);
      const product = await productsService.updateProduct(req.params.id, validatedData);
      return res.status(200).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: err.errors });
      }
      next(err);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productsService.deleteProduct(req.params.id);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductsController();
