import { z } from "zod";

export const createDisciplineSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .transform((v) => v.toUpperCase()),
  name: z.string().trim().min(2, "Le nom est requis."),
});

export const updateDisciplineSchema = z.object({
  name: z.string().trim().min(2).optional(),
  active: z.boolean().optional(),
});

export type CreateDisciplineInput = z.infer<typeof createDisciplineSchema>;
export type UpdateDisciplineInput = z.infer<typeof updateDisciplineSchema>;
