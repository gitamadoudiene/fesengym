import { z } from "zod";

export const createAthleteSchema = z.object({
  clubId: z.string().trim().optional(), // requis si l'appelant est un rôle d'administration
  firstName: z.string().trim().min(2, "Le prénom est requis."),
  lastName: z.string().trim().min(2, "Le nom est requis."),
  dateOfBirth: z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Date de naissance invalide.",
  }),
  sex: z.enum(["M", "F"]),
  nationality: z.string().trim().min(2),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email("Email invalide.").optional().or(z.literal("")),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  disciplineId: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  emergencyContactName: z.string().trim().max(150).optional(),
  emergencyContactPhone: z.string().trim().max(30).optional(),
  medicalNotes: z.string().trim().max(2000).optional(),
});

export const updateAthleteSchema = createAthleteSchema
  .omit({ clubId: true })
  .partial()
  .extend({
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  });

export const listAthletesQuerySchema = z.object({
  search: z.string().trim().optional(),
  clubId: z.string().trim().optional(),
  disciplineId: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  sex: z.enum(["M", "F"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const duplicateCheckSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  dateOfBirth: z.string().optional(),
});

export type CreateAthleteInput = z.infer<typeof createAthleteSchema>;
export type UpdateAthleteInput = z.infer<typeof updateAthleteSchema>;
export type ListAthletesQuery = z.infer<typeof listAthletesQuerySchema>;
