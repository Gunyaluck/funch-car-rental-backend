import bcrypt from "bcrypt";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { authenticate, type AuthContext } from "../../common/middleware/authenticate.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { ok } from "../../common/http/api-response.js";
import { AppError } from "../../common/errors/app-error.js";
import { getCountryProfile, validateTimezone } from "../../common/country-profiles.js";
import { prisma } from "../../lib/prisma.js";

export const usersRouter = Router();

const userProfileSelect = {
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
} as const;

const updateMeBodySchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().min(1).nullable().optional(),
  countryCode: z.string().trim().length(2).toUpperCase().optional(),
  timezone: z.string().trim().min(1).optional(),
});

const updatePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

usersRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (_req, res) => {
    const auth = res.locals.auth as AuthContext;
    const user = await prisma.user.findUnique({
      where: {
        id: auth.userId,
      },
      select: userProfileSelect,
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    res.json(ok(user));
  }),
);

usersRouter.patch(
  "/me",
  authenticate,
  validateRequest({ body: updateMeBodySchema }),
  asyncHandler(async (_req, res) => {
    const auth = res.locals.auth as AuthContext;
    const body = res.locals.validated.body as z.infer<typeof updateMeBodySchema>;
    const countryProfile = body.countryCode ? getCountryProfile(body.countryCode) : null;
    const timezone = body.timezone ? validateTimezone(body.timezone) : countryProfile?.timezone;
    const user = await prisma.user.update({
      where: {
        id: auth.userId,
      },
      data: {
        ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(countryProfile
          ? {
              countryCode: countryProfile.countryCode,
              currencyCode: countryProfile.currencyCode,
            }
          : {}),
        ...(timezone ? { timezone } : {}),
      },
      select: userProfileSelect,
    });

    res.json(ok(user));
  }),
);

usersRouter.patch(
  "/me/password",
  authenticate,
  validateRequest({ body: updatePasswordBodySchema }),
  asyncHandler(async (_req, res) => {
    const auth = res.locals.auth as AuthContext;
    const body = res.locals.validated.body as z.infer<typeof updatePasswordBodySchema>;
    const user = await prisma.user.findUnique({
      where: {
        id: auth.userId,
      },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const isCurrentPasswordValid = await bcrypt.compare(body.currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      throw new AppError(401, "Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
      },
    });

    res.json(ok({ updated: true }));
  }),
);

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
