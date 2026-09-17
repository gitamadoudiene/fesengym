import Image from "next/image";
import QRCode from "qrcode";
import { CheckCircle2, PauseCircle, XCircle } from "lucide-react";
import { getPublicLicenseView } from "@/lib/modules/licenses/service";
import { AuthBackground } from "@/components/layout/auth-background";
import { cn } from "@/lib/utils";

export default async function VerifyLicensePage({
  params,
}: PageProps<"/verify-license/[number]">) {
  const { number } = await params;
  const license = await getPublicLicenseView(number);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-license/${encodeURIComponent(number)}`;
  const qrSvg = await QRCode.toString(verifyUrl, { type: "svg", margin: 1, width: 120 });

  return (
    <AuthBackground>
      <div className="mx-auto w-full max-w-sm space-y-6 text-center">
        <div>
          <Image
            src="/logo.png"
            alt="Fédération Sénégalaise de Gymnastique"
            width={64}
            height={64}
            quality={100}
            className="mx-auto mb-4 block"
          />
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Vérification de licence
          </p>
        </div>

        {!license ? (
          <StatusPanel
            icon={<XCircle className="h-12 w-12 text-destructive" />}
            title="Licence introuvable"
            description={`Aucune licence ne correspond au numéro ${number}.`}
          />
        ) : license.status === "ACTIVE" ? (
          <StatusPanel
            icon={<CheckCircle2 className="h-12 w-12 text-success" />}
            title="Licence valide"
            tone="success"
          >
            <LicenseInfo license={license} />
          </StatusPanel>
        ) : license.status === "SUSPENDED" ? (
          <StatusPanel
            icon={<PauseCircle className="h-12 w-12 text-warning" />}
            title="Licence suspendue"
            tone="warning"
          >
            <LicenseInfo license={license} />
          </StatusPanel>
        ) : (
          <StatusPanel
            icon={<XCircle className="h-12 w-12 text-destructive" />}
            title="Licence expirée ou invalide"
            tone="destructive"
          >
            <LicenseInfo license={license} />
          </StatusPanel>
        )}

        {license && (
          <div
            className="mx-auto w-fit rounded-md border border-border bg-card p-2 shadow-xl shadow-primary/5 [&_svg]:h-24 [&_svg]:w-24"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
        )}
      </div>
    </AuthBackground>
  );
}

function StatusPanel({
  icon,
  title,
  description,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tone?: "success" | "warning" | "destructive";
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-6 shadow-xl shadow-primary/5",
        tone === "success" && "border-success/30 bg-success/5",
        tone === "warning" && "border-warning/30 bg-warning/5",
        tone === "destructive" && "border-destructive/30 bg-destructive/5",
        !tone && "border-border bg-card",
      )}
    >
      <div className="flex justify-center">{icon}</div>
      <h1 className="mt-3 font-heading text-xl font-bold text-foreground">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

type PublicLicense = NonNullable<
  Awaited<ReturnType<typeof getPublicLicenseView>>
>;

function LicenseInfo({ license }: { license: PublicLicense }) {
  return (
    <div className="mt-4 space-y-3 text-left text-sm">
      {license.athlete.hasPhoto && (
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- servi par une route publique dédiée, pas un asset next/image */}
          <img
            src={`/api/public/verify/${encodeURIComponent(license.number)}/photo`}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <Row label="Athlète" value={`${license.athlete.firstName} ${license.athlete.lastName}`} />
      <Row label="Club" value={license.club.name} />
      <Row label="Discipline" value={license.discipline.name} />
      <Row label="Catégorie" value={license.category.name} />
      <Row label="N° licence" value={license.number} mono />
      <Row label="Émise le" value={license.issuedAt.toLocaleDateString("fr-FR")} />
      <Row label="Expire le" value={license.expiresAt.toLocaleDateString("fr-FR")} />
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium text-foreground", mono && "font-mono")}>{value}</span>
    </div>
  );
}
