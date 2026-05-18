import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../errors/app-error.js";

export type AuthContext = {
  userId: string;
  role: string;
};

const extractBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
};

const readAuthContext = (req: Request): AuthContext | null => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token || !env.JWT_ACCESS_SECRET) {
    return null;
  }

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const role = typeof payload.role === "string" ? payload.role : null;

    if (!userId || !role || payload.type !== "access") {
      throw new AppError(401, "Invalid access token");
    }

  return { userId, role };
};

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const auth = readAuthContext(req);

    if (!auth) {
      throw new AppError(401, "Authentication required");
    }

    res.locals.auth = auth;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, "Invalid access token"));
  }
};

export const authorize =
  (...roles: string[]) =>
  (_req: Request, res: Response, next: NextFunction) => {
    const auth = res.locals.auth as AuthContext | undefined;

    if (!auth) {
      next(new AppError(401, "Authentication required"));
      return;
    }

    if (!roles.includes(auth.role)) {
      next(new AppError(403, "Forbidden"));
      return;
    }

    next();
  };
