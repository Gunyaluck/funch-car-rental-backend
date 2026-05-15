import { z } from "zod";

const emailSchema = z.string().trim().email().toLowerCase();
const passwordSchema = z.string().min(8, "Password must be at least 8 characters");
const optionalTextSchema = z.string().trim().min(1).optional();

export const registerBodySchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: optionalTextSchema,
  countryCode: z.string().trim().length(2).toUpperCase().default("TH"),
  timezone: z.string().trim().min(1).default("Asia/Bangkok"),
  currencyCode: z.string().trim().length(3).toUpperCase().default("THB"),
  deviceInfo: optionalTextSchema,
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
  deviceInfo: optionalTextSchema,
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
  deviceInfo: optionalTextSchema,
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
