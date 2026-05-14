import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { ok } from "../../common/http/api-response.js";
import type { CarIdParams, ListCarsQuery } from "./cars.schemas.js";
import { getCarById, listCars } from "./cars.service.js";

export const listCarsController = async (_req: Request, res: Response) => {
  const query = res.locals.validated.query as ListCarsQuery;
  const result = await listCars(query);
  res.json(ok(result.data, result.meta));
};

export const getCarByIdController = async (_req: Request, res: Response) => {
  const { id } = res.locals.validated.params as CarIdParams;
  const result = await getCarById(id);

  if (!result) {
    throw new AppError(404, "Car not found");
  }

  res.json(ok(result.data));
};
