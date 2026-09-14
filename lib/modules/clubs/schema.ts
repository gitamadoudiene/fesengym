import { z } from "zod";

export const createClubSchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis."),
  acronym: z.string().trim().max(20).optional(),
  affiliationNumber: z.string().trim().max(50).optional(),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  region: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email("Email invalide.").optional().or(z.literal("")),
  managerName: z.string().trim().max(150).optional(),
  presidentName: z.string().trim().max(150).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const updateClubSchema = createClubSchema.partial();

export const clubStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
  reason: z.string().trim().max(500).optional(),
});

export const listClubsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  region: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateClubInput = z.infer<typeof createClubSchema>;
export type UpdateClubInput = z.infer<typeof updateClubSchema>;
export type ListClubsQuery = z.infer<typeof listClubsQuerySchema>;
