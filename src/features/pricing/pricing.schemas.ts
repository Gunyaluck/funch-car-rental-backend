import { z } from "zod";

export const quotePricingSchema = z
  .object({
    carId: z.string().trim().min(1),
    pickupAt: z.coerce.date(),
    returnAt: z.coerce.date(),
    optionIds: z.array(z.string().trim().min(1)).default([]),
  })
  .superRefine((value, ctx) => {
    if (value.pickupAt >= value.returnAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "returnAt must be later than pickupAt",
        path: ["returnAt"],
      });
    }
  });

export type QuotePricingInput = z.infer<typeof quotePricingSchema>;
