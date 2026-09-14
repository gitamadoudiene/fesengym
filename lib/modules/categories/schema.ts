import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, "Le nom est requis."),
  disciplineId: z.string().trim().optional(),
  minAge: z.number().int().min(0).max(120).optional(),
  maxAge: z.number().int().min(0).max(120).optional(),
  sex: z.enum(["M", "F"]).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  active: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
