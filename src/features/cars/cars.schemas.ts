import { z } from "zod";

const positiveInt = z.coerce.number().int().positive();

export const listCarsQuerySchema = z
  .object({
    countryCode: z.string().trim().min(1).max(10).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(50).optional(),
    transmission: z.string().trim().min(1).max(50).optional(),
    seats: positiveInt.optional(),
    pickupAt: z.coerce.date().optional(),
    returnAt: z.coerce.date().optional(),
    page: positiveInt.default(1),
    limit: positiveInt.max(100).default(12),
  })
  .superRefine((value, ctx) => {
    if ((value.pickupAt && !value.returnAt) || (!value.pickupAt && value.returnAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "pickupAt and returnAt must be provided together",
        path: value.pickupAt ? ["returnAt"] : ["pickupAt"],
      });
    }

    if (value.pickupAt && value.returnAt && value.pickupAt >= value.returnAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "returnAt must be later than pickupAt",
        path: ["returnAt"],
      });
    }
  });

export const carIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type ListCarsQuery = z.infer<typeof listCarsQuerySchema>;
export type CarIdParams = z.infer<typeof carIdParamsSchema>;
