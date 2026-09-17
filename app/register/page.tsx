import Image from "next/image";
import Link from "next/link";
import { AuthBackground } from "@/components/layout/auth-background";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <AuthBackground>
      <div className="mx-auto w-full max-w-xl space-y-6">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="Fédération Sénégalaise de Gymnastique"
            width={64}
            height={64}
            quality={100}
            className="mx-auto mb-4 block"
          />
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
    </AuthBackground>
  );
}
