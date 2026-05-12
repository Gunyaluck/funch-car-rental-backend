import { Router } from "express";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { ok } from "../../common/http/api-response.js";
import { prisma } from "../../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;

    res.json(
      ok({
        status: "ok",
        database: "connected",
        message: "Car Rental API is running",
      }),
    );
  }),
);
