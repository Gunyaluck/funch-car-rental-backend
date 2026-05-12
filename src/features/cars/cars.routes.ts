import { Router } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { ok } from "../../common/http/api-response.js";
import { asyncHandler } from "../../common/middleware/async-handler.js";
import { validateRequest } from "../../common/middleware/validate-request.js";
import { carIdParamsSchema, listCarsQuerySchema } from "./cars.schemas.js";
import { getCarById, listCars } from "./cars.service.js";

export const carsRouter = Router();

carsRouter.get(
  "/",
  validateRequest({ query: listCarsQuerySchema }),
  asyncHandler(async (req, res) => {
    const result = await listCars(req.query as typeof req.query & Parameters<typeof listCars>[0]);
    res.json(ok(result.data, result.meta));
  }),
);

carsRouter.get(
  "/:id",
  validateRequest({ params: carIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as typeof req.params & { id: string };
    const result = await getCarById(id);

    if (!result) {
      throw new AppError(404, "Car not found");
    }

    res.json(ok(result.data));
  }),
);
