import { z } from "zod";

export const contactPayloadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().trim().max(0).optional(),
  turnstileToken: z.string().trim().optional()
});

export type ContactPayload = z.infer<typeof contactPayloadSchema>;

export const contactApiSuccessSchema = z.object({
  ok: z.literal(true),
  requestId: z.string()
});

export const contactApiErrorSchema = z.object({
  ok: z.literal(false),
  error: z.enum(["validation_error", "spam_detected", "delivery_failed", "service_unavailable"])
});
