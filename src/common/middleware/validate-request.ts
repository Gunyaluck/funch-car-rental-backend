import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type RequestSchemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export const validateRequest =
  (schemas: RequestSchemas) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.query) {
      req.query = schemas.query.parse(req.query) as Request["query"];
    }

    if (schemas.params) {
      req.params = schemas.params.parse(req.params) as Request["params"];
    }

    next();
  };
