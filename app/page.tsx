import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, CreditCard, Wallet, IdCard, Search } from "lucide-react";
import { getSessionUser } from "@/lib/auth/dal";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-heading text-sm font-bold text-primary-foreground">
              FSG
            </div>
            <span className="font-heading text-sm font-semibold text-foreground">
              FSG Gestion
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" render={<Link href="/login" />}>
              Se connecter
            </Button>
            <Button render={<Link href="/register" />}>Rejoindre la FSG</Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            La plateforme officielle de gestion des licences
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Fédération Sénégalaise de Gymnastique — demande, suivi, paiement
            et carte de licence, entièrement en ligne pour votre club.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/register" />}>
              Inscrire mon club
            </Button>
            <Button size="lg" variant="secondary" render={<Link href="/login" />}>
              J&apos;ai déjà un compte
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-surface-muted/40">
          <div className="mx-auto max-w-5xl px-4 py-16">
            <h2 className="text-center font-heading text-2xl font-bold text-foreground">
              Tout le parcours d&apos;un club, sur une seule plateforme
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<FileText className="h-6 w-6" />}
                title="Demande de licence"
                description="Créez vos athlètes et soumettez leurs demandes de licence directement en ligne, saison après saison."
              />
              <FeatureCard
                icon={<Wallet className="h-6 w-6" />}
                title="Paiement"
                description="Déclarez votre paiement (Wave, Orange Money, espèces, virement) et suivez sa vérification par la fédération."
              />
              <FeatureCard
                icon={<CreditCard className="h-6 w-6" />}
                title="Suivi en temps réel"
                description="Suivez l'état de chaque dossier : soumis, en vérification, validé — jusqu'à la délivrance de la licence."
              />
              <FeatureCard
                icon={<IdCard className="h-6 w-6" />}
                title="Carte physique"
                description="Commandez la carte de licence physique de vos athlètes et suivez son impression et son expédition."
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            Vous avez un numéro de licence ?
          </div>
          <h3 className="mt-2 font-heading text-xl font-bold text-foreground">
            Vérifiez la validité d&apos;une licence
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Scannez le QR code de la carte, ou saisissez directement
            l&apos;adresse : fesengym.vercel.app/verify-license/[numéro]
          </p>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Fédération Sénégalaise de Gymnastique — Stade Iba Mar Diop, Médina, Dakar
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
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-3 font-heading text-base font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
