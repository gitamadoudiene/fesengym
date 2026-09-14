import { z } from "zod";

export const createSeasonSchema = z
  .object({
    name: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{4}$/, "Format attendu : AAAA-AAAA (ex: 2026-2027)."),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "La date de fin doit être postérieure à la date de début.",
    path: ["endDate"],
  });

export const updateSeasonStatusSchema = z.object({
  status: z.enum(["UPCOMING", "ACTIVE", "CLOSED"]),
});

export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;
