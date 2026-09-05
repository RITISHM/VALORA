const prisma = require("../prisma");

class PurchaseOrdersService {
  async generatePONumber() {
    const count = await prisma.purchaseOrder.count();
    const num = (count + 1).toString().padStart(5, "0");
    return `PO${num}`;
  }

  async create({ vendor_id, po_date = new Date(), lines = [] }) {
    if (!vendor_id) {
      const error = new Error("vendor_id is required");
      error.statusCode = 400;
      throw error;
    }

    const po_number = await this.generatePONumber();

    let docSubtotal = 0;
    let docTaxAmount = 0;

    const formattedLines = lines.map((line) => {
      const qty = parseFloat(line.qty) || 1.0;
      const unit_price = parseFloat(line.unit_price) || 0.0;
      const tax_rate = parseFloat(line.tax_rate) || 0.0;

      if (tax_rate < 0) {
        const error = new Error("Tax rate cannot be negative");
        error.statusCode = 400;
        throw error;
      }

      const lineSubtotal = Math.round(qty * unit_price * 100) / 100;
      const lineTax = Math.round(lineSubtotal * (tax_rate / 100) * 100) / 100;
      const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;

      docSubtotal += lineSubtotal;
      docTaxAmount += lineTax;

      return {
        product_id: line.product_id,
        analytic_account_id: line.analytic_account_id || null,
        qty,
        unit_price,
        tax_rate,
        tax_amount: lineTax,
        total: lineTotal,
      };
    });

    docSubtotal = Math.round(docSubtotal * 100) / 100;
    docTaxAmount = Math.round(docTaxAmount * 100) / 100;
    const docTotal = Math.round((docSubtotal + docTaxAmount) * 100) / 100;

    return await prisma.purchaseOrder.create({
      data: {
        po_number,
        vendor_id,
        po_date: new Date(po_date),
        status: "DRAFT",
        subtotal: docSubtotal,
        tax_amount: docTaxAmount,
        total: docTotal,
        lines: {
          create: formattedLines,
        },
      },
      include: {
        vendor: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });
  }

  async getAll() {
    return await prisma.purchaseOrder.findMany({
      orderBy: {
        po_date: "desc",
      },
      include: {
        vendor: true,
        vendor_bills: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });
  }

  async getById(id) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        vendor_bills: true,
        lines: {
          include: {
            product: true,
            analytic_account: true,
          },
        },
      },
    });

    if (!po) {
      const error = new Error("Purchase Order not found");
      error.statusCode = 404;
      throw error;
    }

    return po;
  }

  async confirm(id) {
    try {
      return await prisma.purchaseOrder.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: {
          vendor: true,
          lines: {
            include: {
              product: true,
              analytic_account: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === "P2025") {
        const err = new Error("Purchase Order not found");
        err.statusCode = 404;
        throw err;
      }
      throw error;
    }
  }
}

module.exports = new PurchaseOrdersService();
