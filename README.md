# FSG Gestion — Plateforme de gestion des licences

Plateforme de gestion des licences sportives pour la Fédération Sénégalaise de Gymnastique (FSG).

Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour l'architecture technique, [DECISIONS.md](DECISIONS.md)
pour la justification des choix techniques, et [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) pour l'identité
visuelle.

## Stack

Next.js 16 (App Router, TypeScript) · PostgreSQL · Prisma · Auth.js · Tailwind CSS + shadcn/ui.

## Installation

```bash
npm install
cp .env.example .env
```

Renseigner `DATABASE_URL` dans `.env` avec une base PostgreSQL (Neon, Supabase, ou instance locale).
Générer `AUTH_SECRET` avec `openssl rand -base64 32`.

## Base de données

```bash
npm run db:migrate   # applique les migrations (crée la base au premier lancement)
npm run db:seed      # données de démonstration (comptes, clubs, disciplines, saison)
```

Le script de seed affiche les identifiants des comptes de démonstration créés (un par rôle).

## Lancement

```bash
npm run dev
```

Application disponible sur [http://localhost:3000](http://localhost:3000).

## Tâche planifiée (expiration des licences)

En développement/self-host sans scheduler externe :

```bash
npm run worker
```

En production avec un scheduler externe (cron système, Vercel Cron, GitHub Actions), appeler
`POST /api/cron/expire-licenses` avec l'en-tête `Authorization: Bearer <CRON_SECRET>`.

## Vérifications

```bash
npx tsc --noEmit   # typecheck
npx eslint .       # lint
npm run build      # build de production
```

## Déploiement

Voir ARCHITECTURE.md §14 pour les options recommandées (VPS + Docker, ou Vercel + Neon + R2).
