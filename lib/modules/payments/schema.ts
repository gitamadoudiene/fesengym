import { z } from "zod";

export const recordPaymentSchema = z.object({
  licenseRequestId: z.string().trim().min(1),
  method: z.enum(["CASH", "WAVE", "ORANGE_MONEY", "BANK_TRANSFER", "CARD", "OTHER"]),
  transactionReference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const verifyPaymentSchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED"]),
  notes: z.string().trim().max(1000).optional(),
});

export const listPaymentsQuerySchema = z.object({
  status: z.enum(["PENDING", "PAID", "VERIFIED", "FAILED", "REJECTED", "REFUNDED"]).optional(),
  method: z.enum(["CASH", "WAVE", "ORANGE_MONEY", "BANK_TRANSFER", "CARD", "OTHER"]).optional(),
  clubId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
