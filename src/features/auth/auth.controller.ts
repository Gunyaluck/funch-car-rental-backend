import type { Request, Response } from "express";
import { ok } from "../../common/http/api-response.js";
import type { LoginBody, LogoutBody, RefreshBody, RegisterBody } from "./auth.schemas.js";
import { login, logout, refresh, register } from "./auth.service.js";

export const registerController = async (_req: Request, res: Response) => {
  const body = res.locals.validated.body as RegisterBody;
  const result = await register(body);

  res.status(201).json(ok(result));
};

export const loginController = async (_req: Request, res: Response) => {
  const body = res.locals.validated.body as LoginBody;
  const result = await login(body);

  res.json(ok(result));
};

export const refreshController = async (_req: Request, res: Response) => {
  const body = res.locals.validated.body as RefreshBody;
  const result = await refresh(body);

  res.json(ok(result));
};

export const logoutController = async (_req: Request, res: Response) => {
  const body = res.locals.validated.body as LogoutBody;
  await logout(body.refreshToken);

  res.status(204).send();
};
