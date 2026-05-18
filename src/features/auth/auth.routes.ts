import { Router } from "express";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import {
  loginController,
  logoutController,
  refreshController,
  registerController,
} from "./auth.controller.js";
import {
  loginBodySchema,
  logoutBodySchema,
  refreshBodySchema,
  registerBodySchema,
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  validateRequest({ body: registerBodySchema }),
  asyncHandler(registerController),
);

authRouter.post(
  "/login",
  validateRequest({ body: loginBodySchema }),
  asyncHandler(loginController),
);

authRouter.post(
  "/refresh",
  validateRequest({ body: refreshBodySchema }),
  asyncHandler(refreshController),
);

authRouter.post(
  "/logout",
  validateRequest({ body: logoutBodySchema }),
  asyncHandler(logoutController),
);
