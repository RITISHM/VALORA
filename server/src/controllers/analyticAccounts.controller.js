const analyticAccountsService = require("../services/analyticAccounts.service");
const { z } = require("zod");

const analyticAccountSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .refine((val) => typeof val === "string" && val.trim().length > 0, {
      message: "Name must not be empty",
    })
    .transform((val) => val.trim()),
  type: z.enum(["INCOME", "EXPENSE"], {
    required_error: "Type is required",
    invalid_type_error: "Type must be INCOME or EXPENSE",
    errorMap: (issue, ctx) => {
      if (issue.code === "invalid_enum_value" || issue.code === "invalid_type") {
        return { message: "Type must be INCOME or EXPENSE" };
      }
      return { message: ctx.defaultError };
    },
  }),
});

class AnalyticAccountsController {
  async create(req, res, next) {
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Request body must be a JSON object" });
      }

      const parseResult = analyticAccountSchema.safeParse(req.body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues || [];
        const firstError = issues[0]?.message || "Validation failed";
        return res.status(400).json({
          error: firstError,
          details: issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      const created = await analyticAccountsService.create(parseResult.data);
      return res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const records = await analyticAccountsService.getAll();
      return res.status(200).json(records);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid ID parameter" });
      }

      const record = await analyticAccountsService.getById(id);
      if (!record) {
        return res.status(404).json({ error: "Analytic account not found" });
      }

      return res.status(200).json(record);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid ID parameter" });
      }

      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Request body must be a JSON object" });
      }

      const parseResult = analyticAccountSchema.safeParse(req.body);
      if (!parseResult.success) {
        const issues = parseResult.error.issues || [];
        const firstError = issues[0]?.message || "Validation failed";
        return res.status(400).json({
          error: firstError,
          details: issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      const updated = await analyticAccountsService.update(id, parseResult.data);
      return res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Invalid ID parameter" });
      }

      await analyticAccountsService.delete(id);
      return res.status(200).json({ message: "Analytic account deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticAccountsController();
