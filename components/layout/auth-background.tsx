/**
 * Arrière-plan abstrait partagé par les pages publiques autonomes (connexion,
 * inscription, vérification de licence) : deux halos flous aux couleurs de
 * marque + une trame de points très discrète, pour un rendu premium sans
 * verser dans l'effet "sportif tape-à-l'œil" — voir DESIGN_SYSTEM.md §1.
 */
export function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, var(--color-foreground) 1px, transparent 0)",
          backgroundSize: "32px 32px",
          opacity: 0.04,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary opacity-[0.12] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-accent opacity-[0.14] blur-3xl"
      />
      <div className="relative w-full">{children}</div>
    </div>
  );
}
