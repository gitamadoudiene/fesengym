import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import {
  FileText,
  Wallet,
  IdCard,
  Search,
  ShieldCheck,
  ClipboardCheck,
  Award,
} from "lucide-react";
import { getSessionUser } from "@/lib/auth/dal";
import { getPublicStats } from "@/lib/modules/dashboard/service";
import { Button } from "@/components/ui/button";
import { VerifySearchForm } from "./verify-search-form";

export default async function Home() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  const stats = await getPublicStats();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const qrSvg = await QRCode.toString(`${baseUrl}/verify-license/FSG-2027-000128`, {
    type: "svg",
    margin: 0,
    width: 72,
    color: { dark: "#16231D", light: "#00000000" },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------ */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FSG" width={36} height={36} />
            <span className="font-heading text-[15px] font-bold tracking-tight text-foreground">
              FSG Gestion
            </span>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#parcours" className="transition-colors hover:text-foreground">
              Le parcours
            </a>
            <a href="#verifier" className="transition-colors hover:text-foreground">
              Vérifier une licence
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" render={<Link href="/login" />}>
              Se connecter
            </Button>
            <Button className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90" render={<Link href="/register" />}>
              Inscrire mon club
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ---------------------------------------------------------- */}
        {/* Hero */}
        {/* ---------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-primary pb-28 pt-16 sm:pt-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 ring-1 ring-white/15">
                <ShieldCheck className="h-3.5 w-3.5" />
                Plateforme officielle de la fédération
              </span>

              <h1 className="mt-5 font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
                La licence de votre club,{" "}
                <span className="text-brand-accent">de la demande à la carte</span>.
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75">
                Inscrivez votre club, enregistrez vos athlètes et suivez chaque
                demande de licence — paiement, validation, délivrance et
                commande de la carte physique — depuis un seul espace.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button
                  size="lg"
                  className="bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90"
                  render={<Link href="/register" />}
                >
                  Inscrire mon club
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:bg-white/10 hover:text-white"
                  render={<Link href="/login" />}
                >
                  J&apos;ai déjà un compte
                </Button>
              </div>

              <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-6 sm:max-w-md">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-white/50">
                    Athlètes
                  </dt>
                  <dd className="mt-1 font-heading text-2xl font-extrabold text-white">
                    {stats.totalAthletes}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-white/50">
                    Clubs actifs
                  </dt>
                  <dd className="mt-1 font-heading text-2xl font-extrabold text-white">
                    {stats.activeClubs}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-white/50">
                    Licences actives
                  </dt>
                  <dd className="mt-1 font-heading text-2xl font-extrabold text-white">
                    {stats.activeLicenses}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Aperçu réel de la carte de licence, plutôt qu'une photo générique */}
            <div className="relative mx-auto w-full max-w-sm lg:mx-0">
              <div className="absolute -inset-6 rounded-[2rem] bg-white/5 blur-2xl" aria-hidden />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl">
                <div className="flex items-center justify-between bg-primary px-5 py-3">
                  <p className="font-heading text-xs font-bold tracking-wide text-white">
                    LICENCE FSG — 2026-2027
                  </p>
                  <IdCard className="h-4 w-4 text-white/70" />
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div className="space-y-1">
                    <p className="font-heading text-base font-bold text-foreground">
                      Aïcha Fall
                    </p>
                    <p className="text-xs text-muted-foreground">Dakar Gym Club</p>
                    <p className="text-xs text-muted-foreground">
                      Gymnastique Artistique · Cadet
                    </p>
                    <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                      FSG-2027-000128
                    </p>
                  </div>
                  <div
                    className="shrink-0 rounded-lg bg-muted p-2 [&_svg]:h-16 [&_svg]:w-16"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                </div>
                <div className="flex items-center justify-between border-t border-border bg-surface-muted px-5 py-2.5">
                  <span className="text-[11px] font-medium text-success">● Active</span>
                  <span className="text-[11px] text-muted-foreground">Expire 31/08/2027</span>
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-white/50">
                Exemple illustratif — chaque licence délivrée génère sa propre carte et son QR code.
              </p>
            </div>
          </div>

          {/* Courbe de séparation — inspirée de fesengym.com */}
          <svg
            aria-hidden
            className="absolute bottom-0 left-0 w-full text-background"
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
          >
            <path d="M0,80 C480,0 960,0 1440,80 L1440,80 L0,80 Z" fill="currentColor" />
          </svg>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Parcours / fonctionnalités */}
        {/* ---------------------------------------------------------- */}
        <section id="parcours" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              Tout le parcours de licence, sur une seule plateforme
            </h2>
            <p className="mt-3 text-muted-foreground">
              Du premier dossier à la carte entre les mains de l&apos;athlète.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<FileText className="h-5 w-5" />}
              title="Demande de licence"
              description="Créez vos athlètes et soumettez leurs demandes en ligne, saison après saison."
            />
            <FeatureCard
              icon={<Wallet className="h-5 w-5" />}
              title="Paiement"
              description="Déclarez le paiement (Wave, Orange Money, espèces, virement) et suivez sa vérification."
            />
            <FeatureCard
              icon={<ClipboardCheck className="h-5 w-5" />}
              title="Suivi en temps réel"
              description="Soumis, en vérification, validé — chaque étape du dossier est visible instantanément."
            />
            <FeatureCard
              icon={<Award className="h-5 w-5" />}
              title="Carte physique"
              description="Commandez la carte de licence de vos athlètes et suivez impression et expédition."
            />
          </div>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* Vérification publique */}
        {/* ---------------------------------------------------------- */}
        <section id="verifier" className="border-y border-border bg-surface-muted/60">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-heading text-xl font-bold text-foreground sm:text-2xl">
                Vérifier la validité d&apos;une licence
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Scannez le QR code présent sur la carte, ou saisissez directement
                son numéro pour consulter son statut — sans connexion requise.
              </p>
              <VerifySearchForm />
            </div>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------ */}
      {/* Footer */}
      {/* ------------------------------------------------------------ */}
      <footer className="bg-primary text-white/70">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="FSG" width={32} height={32} />
                <span className="font-heading text-sm font-bold text-white">
                  FSG Gestion
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed">
                Plateforme officielle de gestion des licences de la Fédération
                Sénégalaise de Gymnastique.
                {stats.currentSeasonName && ` Saison ${stats.currentSeasonName}.`}
              </p>
            </div>

            <FooterColumn
              title="Plateforme"
              links={[
                { label: "Inscrire mon club", href: "/register" },
                { label: "Se connecter", href: "/login" },
                { label: "Vérifier une licence", href: "#verifier" },
              ]}
            />
            <FooterColumn
              title="Disciplines"
              links={[
                { label: "Gymnastique Artistique", href: "#" },
                { label: "Gymnastique Rythmique", href: "#" },
                { label: "Trampoline", href: "#" },
                { label: "Aérobic", href: "#" },
              ]}
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                Contact
              </p>
              <p className="mt-4 text-sm leading-relaxed">
                Stade Iba Mar Diop
                <br />
                Médina, Dakar — Sénégal
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/50">
            © {new Date().getFullYear()} Fédération Sénégalaise de Gymnastique.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-heading text-[15px] font-bold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
