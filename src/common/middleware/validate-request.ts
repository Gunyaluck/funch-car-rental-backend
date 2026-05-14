import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type RequestSchemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

export const validateRequest =
  (schemas: RequestSchemas) =>
  (req: Request, res: Response, next: NextFunction) => {
    const validated: {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    } = {};

    if (schemas.body) {
      validated.body = schemas.body.parse(req.body);
    }

    if (schemas.query) {
      validated.query = schemas.query.parse(req.query);
    }

    if (schemas.params) {
      validated.params = schemas.params.parse(req.params);
    }

    res.locals.validated = validated;

    next();
  };
