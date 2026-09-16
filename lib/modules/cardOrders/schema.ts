import { z } from "zod";

export const createCardOrderSchema = z.object({
  licenseId: z.string().trim().min(1),
});

export const updateCardOrderStatusSchema = z.object({
  status: z.enum(["PRINTING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingReference: z.string().trim().max(100).optional(),
});

export const listCardOrdersQuerySchema = z.object({
  status: z.enum(["REQUESTED", "PRINTING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
