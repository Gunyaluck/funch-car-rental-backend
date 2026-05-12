import { Router } from "express";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { ok } from "../../common/http/api-response.js";
import { prisma } from "../../lib/prisma.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        countryCode: true,
        timezone: true,
        currencyCode: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
      },
    });

    res.json(
      ok(users, {
        count: users.length,
      }),
    );
  }),
);
