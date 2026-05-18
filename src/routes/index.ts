import { Router } from "express";
import { ok } from "../common/http/api-response.js";
import { authRouter } from "../features/auth/auth.routes.js";
import { carsRouter } from "../features/cars/cars.routes.js";
import { healthRouter } from "../features/health/health.routes.js";
import { pricingRouter } from "../features/pricing/pricing.routes.js";
import { usersRouter } from "../features/users/users.routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json(
    ok({
      status: "ok",
      message: "Funch Car Rental API is online",
      endpoints: ["/health", "/auth", "/cars", "/cars/:id", "/pricing/quote", "/users"],
    }),
  );
});

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/cars", carsRouter);
apiRouter.use("/pricing", pricingRouter);
apiRouter.use("/users", usersRouter);
