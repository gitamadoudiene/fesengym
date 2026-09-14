import { z } from "zod";

export const createUserSchema = z
  .object({
    email: z.string().trim().email("Email invalide."),
    firstName: z.string().trim().min(2, "Le prénom est requis."),
    lastName: z.string().trim().min(2, "Le nom est requis."),
    role: z.enum(["SUPER_ADMIN", "FEDERAL_ADMIN", "AGENT", "CLUB_MANAGER"]),
    clubId: z.string().trim().optional(),
    password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  })
  .refine((data) => data.role !== "CLUB_MANAGER" || !!data.clubId, {
    message: "Un club est requis pour un responsable de club.",
    path: ["clubId"],
  });

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
