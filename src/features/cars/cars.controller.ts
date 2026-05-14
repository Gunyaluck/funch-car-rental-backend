import type { Request, Response } from "express";
import { AppError } from "../../common/errors/app-error.js";
import { ok } from "../../common/http/api-response.js";
import type { CarIdParams, ListCarsQuery } from "./cars.schemas.js";
import { getCarById, listCars } from "./cars.service.js";

export const listCarsController = async (req: Request, res: Response) => {
  const result = await listCars(req.query as unknown as ListCarsQuery);
  res.json(ok(result.data, result.meta));
};

export const getCarByIdController = async (req: Request, res: Response) => {
  const { id } = req.params as unknown as CarIdParams;
  const result = await getCarById(id);

  if (!result) {
    throw new AppError(404, "Car not found");
  }

  res.json(ok(result.data));
};
