import { Router } from "express";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { quotePricingController } from "./pricing.controller.js";
import { quotePricingSchema } from "./pricing.schemas.js";

export const pricingRouter = Router();

pricingRouter.post(
  "/quote",
  validateRequest({ body: quotePricingSchema }),
  asyncHandler(quotePricingController),
);
