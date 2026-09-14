import { z } from "zod";

export const suspendLicenseSchema = z.object({
  reason: z.string().trim().min(3, "Le motif de suspension est requis."),
});

export const listLicensesQuerySchema = z.object({
  clubId: z.string().trim().optional(),
  seasonId: z.string().trim().optional(),
  disciplineId: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  status: z
    .enum([
      "DRAFT",
      "PENDING",
      "UNDER_REVIEW",
      "APPROVED",
      "ACTIVE",
      "EXPIRED",
      "SUSPENDED",
      "CANCELLED",
      "REJECTED",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
