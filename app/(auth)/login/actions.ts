"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: (formData.get("callbackUrl") as string) || "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Email ou mot de passe incorrect.";
        default:
          return "Une erreur est survenue lors de la connexion.";
      }
    }
    // NextAuth signale une redirection réussie en relançant une erreur
    // interne Next.js (NEXT_REDIRECT) — elle doit être propagée telle quelle.
    throw error;
  }
}
