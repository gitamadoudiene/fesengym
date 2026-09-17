import Image from "next/image";
import { AuthBackground } from "@/components/layout/auth-background";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : "/dashboard";

  return (
    <AuthBackground>
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/logo.png"
            alt="Fédération Sénégalaise de Gymnastique"
            width={64}
            height={64}
            quality={100}
            className="mx-auto mb-4 block"
          />
          <h1 className="font-heading text-2xl font-bold text-foreground">
            FSG Gestion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fédération Sénégalaise de Gymnastique
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </AuthBackground>
  );
}
