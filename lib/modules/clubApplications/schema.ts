import { z } from "zod";

export const createClubApplicationSchema = z.object({
  // Club
  name: z.string().trim().min(2, "Le nom du club est requis."),
  acronym: z.string().trim().max(20).optional(),
  address: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2, "La ville est requise."),
  region: z.string().trim().min(2, "La région est requise."),
  phone: z.string().trim().min(6, "Le téléphone est requis."),
  presidentName: z.string().trim().min(2, "Le nom du président est requis."),

  // Compte du responsable
  managerFirstName: z.string().trim().min(2, "Le prénom est requis."),
  managerLastName: z.string().trim().min(2, "Le nom est requis."),
  email: z.string().trim().email("Email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

export type CreateClubApplicationInput = z.infer<typeof createClubApplicationSchema>;

export const clubApplicationDecisionSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});
