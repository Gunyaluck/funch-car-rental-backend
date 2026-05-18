import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { UserStatus, type User } from "@prisma/client";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/app-error.js";
import { getCountryProfile, validateTimezone } from "../../common/country-profiles.js";
import { prisma } from "../../lib/prisma.js";
import type { LoginBody, RefreshBody, RegisterBody } from "./auth.schemas.js";

type TokenUser = Pick<User, "id" | "email" | "firstName" | "lastName" | "role" | "status">;

type RefreshTokenPayload = JwtPayload & {
  sub: string;
  jti: string;
  type: "refresh";
};

type JwtExpiresIn = NonNullable<SignOptions["expiresIn"]>;

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  status: true,
} as const;

const assertJwtConfig = () => {
  if (!env.JWT_ACCESS_SECRET || !env.JWT_REFRESH_SECRET) {
    throw new AppError(500, "JWT secrets are not configured");
  }

  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
  };
};

const parseDurationMs = (duration: string) => {
  const match = /^(\d+)(ms|s|m|h|d)?$/.exec(duration.trim());

  if (!match) {
    throw new AppError(500, `Invalid JWT duration: ${duration}`);
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? "ms") as "ms" | "s" | "m" | "h" | "d";
  const unitMs: Record<typeof unit, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * unitMs[unit];
};

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

const toAuthUser = (user: TokenUser) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  status: user.status,
});

const signAccessToken = (user: TokenUser) => {
  const { accessSecret } = assertJwtConfig();

  return jwt.sign(
    {
      role: user.role,
      type: "access",
    },
    accessSecret,
    {
      subject: user.id,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as JwtExpiresIn,
    },
  );
};

const signRefreshToken = (userId: string, tokenId: string) => {
  const { refreshSecret } = assertJwtConfig();

  return jwt.sign(
    {
      type: "refresh",
    },
    refreshSecret,
    {
      jwtid: tokenId,
      subject: userId,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as JwtExpiresIn,
    },
  );
};

const verifyRefreshToken = (refreshToken: string): RefreshTokenPayload => {
  const { refreshSecret } = assertJwtConfig();

  try {
    const payload = jwt.verify(refreshToken, refreshSecret) as JwtPayload;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const tokenId = typeof payload.jti === "string" ? payload.jti : null;

    if (!userId || !tokenId || payload.type !== "refresh") {
      throw new AppError(401, "Invalid refresh token");
    }

    return {
      ...payload,
      sub: userId,
      jti: tokenId,
      type: "refresh",
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, "Invalid refresh token");
  }
};

const createTokenPair = async (user: TokenUser, deviceInfo?: string) => {
  const refreshTokenId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user.id, refreshTokenId);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshTokenExpiresAt = new Date(Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      userId: user.id,
      tokenHash: refreshTokenHash,
      deviceInfo: deviceInfo ?? null,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return {
    accessToken: signAccessToken(user),
    refreshToken,
    accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  };
};

const validateActiveUser = (user: TokenUser | null) => {
  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new AppError(401, "Invalid credentials");
  }

  return user;
};

export const register = async (body: RegisterBody) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new AppError(409, "Email is already registered");
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const countryProfile = getCountryProfile(body.countryCode);
  const timezone = body.timezone ? validateTimezone(body.timezone) : countryProfile.timezone;
  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone ?? null,
      countryCode: countryProfile.countryCode,
      timezone,
      currencyCode: countryProfile.currencyCode,
    },
    select: userSelect,
  });

  return {
    user: toAuthUser(user),
    tokens: await createTokenPair(user, body.deviceInfo),
  };
};

export const login = async (body: LoginBody) => {
  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
    select: {
      ...userSelect,
      passwordHash: true,
    },
  });

  if (!user || user.status !== UserStatus.ACTIVE) {
    throw new AppError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid credentials");
  }

  return {
    user: toAuthUser(user),
    tokens: await createTokenPair(user, body.deviceInfo),
  };
};

export const refresh = async (body: RefreshBody) => {
  const payload = verifyRefreshToken(body.refreshToken);
  const tokenHash = hashToken(body.refreshToken);

  const storedRefreshToken = await prisma.refreshToken.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  if (
    !storedRefreshToken ||
    storedRefreshToken.id !== payload.jti ||
    storedRefreshToken.userId !== payload.sub ||
    storedRefreshToken.expiresAt <= new Date()
  ) {
    throw new AppError(401, "Invalid refresh token");
  }

  const user = validateActiveUser(storedRefreshToken.user);

  await prisma.refreshToken.delete({
    where: {
      id: storedRefreshToken.id,
    },
  });

  return {
    user: toAuthUser(user),
    tokens: await createTokenPair(user, body.deviceInfo ?? storedRefreshToken.deviceInfo ?? undefined),
  };
};

export const logout = async (refreshToken: string) => {
  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.deleteMany({
    where: {
      tokenHash,
    },
  });
};
