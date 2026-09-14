import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const callbackUrl =
    typeof params.callbackUrl === "string" ? params.callbackUrl : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary font-heading text-xl font-bold text-primary-foreground">
            FSG
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            FSG Gestion
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Fédération Sénégalaise de Gymnastique
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
