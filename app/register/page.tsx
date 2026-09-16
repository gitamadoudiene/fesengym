import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary font-heading text-xl font-bold text-primary-foreground">
            FSG
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Demande d&apos;adhésion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Rejoignez la Fédération Sénégalaise de Gymnastique. Votre demande
            sera examinée par l&apos;administration fédérale.
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
