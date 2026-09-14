import { z } from "zod";

export const createRequestSchema = z.object({
  athleteId: z.string().trim().min(1, "L'athlète est requis."),
  seasonId: z.string().trim().min(1, "La saison est requise."),
  disciplineId: z.string().trim().min(1, "La discipline est requise."),
  categoryId: z.string().trim().min(1, "La catégorie est requise."),
  type: z.enum(["NEW", "RENEWAL", "REPLACEMENT", "UPDATE"]),
  originLicenseId: z.string().trim().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const rejectRequestSchema = z.object({
  reason: z.string().trim().min(3, "Le motif de rejet est requis."),
});

export const correctionRequestSchema = z.object({
  reason: z.string().trim().min(3, "Le motif de la correction est requis."),
});

export const listRequestsQuerySchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "UNDER_REVIEW",
      "CORRECTION_REQUESTED",
      "PAYMENT_PENDING",
      "PAYMENT_VERIFICATION",
      "APPROVED",
      "REJECTED",
    ])
    .optional(),
  clubId: z.string().trim().optional(),
  type: z.enum(["NEW", "RENEWAL", "REPLACEMENT", "UPDATE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;
