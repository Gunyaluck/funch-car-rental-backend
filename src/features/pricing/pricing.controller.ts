import type { Request, Response } from "express";
import { ok } from "../../common/http/api-response.js";
import type { QuotePricingInput } from "./pricing.schemas.js";
import { quotePricing } from "./pricing.service.js";

export const quotePricingController = async (_req: Request, res: Response) => {
  const input = res.locals.validated.body as QuotePricingInput;
  const result = await quotePricing(input);

  res.json(ok(result));
};
