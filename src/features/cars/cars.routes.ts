import { Router } from "express";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { getCarByIdController, listCarsController } from "./cars.controller.js";
import { carIdParamsSchema, listCarsQuerySchema } from "./cars.schemas.js";

export const carsRouter = Router();

carsRouter.get(
  "/",
  validateRequest({ query: listCarsQuerySchema }),
  asyncHandler(listCarsController),
);

carsRouter.get(
  "/:id",
  validateRequest({ params: carIdParamsSchema }),
  asyncHandler(getCarByIdController),
);
