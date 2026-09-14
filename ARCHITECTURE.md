# ARCHITECTURE — Plateforme de Gestion des Licences FSG

## 1. Contexte et périmètre

Projet neuf (aucun code existant). Objectif : logiciel métier complet couvrant le cycle de vie
`Club → Athlète → Demande → Vérification → Paiement → Validation → Licence → Expiration → Renouvellement`,
avec dashboards, statistiques, audit, QR code de vérification publique, et isolation stricte entre clubs.

## 2. Stack technique retenue

| Couche | Choix | 
|---|---|
| Frontend + Backend | **Next.js 14+ (App Router, TypeScript)** — monolithe modulaire | 
| Base de données | **PostgreSQL** |
| ORM | **Prisma** |
| Authentification | **Auth.js (NextAuth v5)**, credentials + sessions JWT |
| Validation | **Zod** (schémas partagés client/serveur) |
| UI | **Tailwind CSS** + **shadcn/ui** (Radix primitives) |
| Formulaires | **React Hook Form** + Zod resolver |
| Graphiques | **Recharts** |
| QR Code | **qrcode** (génération), **jsQR** non nécessaire (scan fait par l'appareil photo natif) |
| PDF licence | **@react-pdf/renderer** |
| Stockage fichiers | Abstraction `StorageProvider` — `LocalStorageProvider` (dev) / `S3StorageProvider` (Cloudflare R2, prod) |
| Tâches planifiées | Route API sécurisée `/api/cron/*` (déclenchée par cron externe) + script worker `node-cron` pour self-host |
| Tests | **Vitest** (unitaire/service) + **Playwright** (E2E workflow critique) |
| Déploiement | Docker Compose (Next.js + Postgres) sur VPS, ou Vercel + Neon (Postgres managé) + R2 |

Voir [DECISIONS.md](DECISIONS.md) pour la justification détaillée de chaque choix face aux alternatives.

## 3. Pourquoi un monolithe modulaire (et pas NestJS + SPA séparée)

Le domaine est riche en règles métier et permissions, mais l'équipe (ici : un seul agent développeur,
puis probablement une petite équipe côté FSG) bénéficie davantage d'un **seul déploiement, un seul
repo, un seul langage** que de la séparation frontend/backend en deux services. Next.js App Router
permet :
- des **Route Handlers** (`app/api/**/route.ts`) jouant le rôle d'API REST interne,
- des **Server Actions** pour les mutations simples liées à l'UI,
- un rendu serveur (RSC) pour les pages lourdes en données (dashboard, tableaux),
- une seule pipeline de build/déploiement, donc un coût d'infrastructure divisé par deux.

Pour conserver la rigueur d'une architecture "à la NestJS" sans la complexité opérationnelle de deux
services, le code applique une **séparation stricte en couches** (voir §5) : aucune règle métier ne vit
dans un composant React ni dans un handler de route — uniquement dans `lib/modules/*/service.ts`.

## 4. Modèle de données (entités principales)

```
User (id, email, passwordHash, role, clubId?, athleteId?, status, ...)
Club (id, code, nom, sigle, numeroAffiliation, adresse, ville, region, tel, email,
      responsableNom, presidentNom, logoDocId, statut, dateCreation, ...)
Athlete (id, numeroFederal, prenom, nom, dateNaissance, sexe, nationalite, tel, email,
         adresse, ville, photoDocId, contactUrgence, clubId, disciplinePrincipaleId,
         statut, infosMedicalesDocId?, ...)
Discipline (id, code, nom, statut)
Category (id, nom, disciplineId?, ageMin, ageMax, sexe?, statut)
Season (id, nom "2026-2027", dateDebut, dateFin, statut, estCourante: bool unique-partiel)
LicenseFee (id, saisonId, disciplineId?, categoryId?, typeDemande, montant, devise)
LicenseRequest (id, numero "REQ-2026-000124", athleteId, clubId, saisonId, disciplineId,
                categoryId, type[NEW|RENEWAL|REPLACEMENT|UPDATE],
                statut[DRAFT|SUBMITTED|UNDER_REVIEW|CORRECTION_REQUESTED|
                       PAYMENT_PENDING|PAYMENT_VERIFICATION|APPROVED|REJECTED],
                dateSoumission, dateTraitement, agentId?, validateurId?,
                motifRejet?, notes?, licenceOrigineId? [pour RENEWAL], ...)
Payment (id, reference, licenseRequestId, licenseId?, athleteId, clubId, montant,
         devise[XOF], methode[CASH|WAVE|ORANGE_MONEY|BANK_TRANSFER|CARD|OTHER],
         statut[PENDING|PAID|VERIFIED|FAILED|REJECTED|REFUNDED], referenceTransaction?,
         date, dateVerification?, verifiePar?, justificatifDocId?, notes?, ...)
License (id, numero "FSG-2026-001245", athleteId, clubId, saisonId, disciplineId,
         categoryId, demandeOrigineId, dateEmission, dateExpiration,
         statut[DRAFT|PENDING|UNDER_REVIEW|APPROVED|ACTIVE|EXPIRED|SUSPENDED|
                CANCELLED|REJECTED],
         statutPaiement[réf. Payment le plus récent, dénormalisé pour perf],
         dateValidation, valideParId, motifSuspension?, qrCodeUrl, ...)
Document (id, type[PHOTO|CERTIFICAT_MEDICAL|JUSTIFICATIF|JUSTIFICATIF_PAIEMENT|
                   ADMINISTRATIF|AUTRE], nom, storageKey, taille, mimeType,
          proprietaireType[ATHLETE|CLUB|LICENSE_REQUEST|PAYMENT], proprietaireId,
          uploadeParId, dateCreation)
Notification (id, destinataireUserId, type, titre, message, lien?, lu: bool, dateCreation)
AuditLog (id, userId, action, entite, entiteId, dateCreation, metadonnees: jsonb)
NumberSequence (id, type[REQUEST|LICENSE], annee, dernierNumero) — génération atomique
```

Relations fortes (clés étrangères partout), contraintes d'unicité :
- `License.numero` UNIQUE, `LicenseRequest.numero` UNIQUE
- `Season.estCourante` : index unique partiel `WHERE estCourante = true` → une seule saison courante
- `Athlete.numeroFederal` UNIQUE
- `(NumberSequence.type, NumberSequence.annee)` UNIQUE

PostgreSQL + Prisma est justifié précisément par cette densité relationnelle (voir DECISIONS.md).

## 5. Organisation du code (séparation des responsabilités)

```
app/
  (public)/verify-license/[numero]/page.tsx      → page publique de vérification
  (auth)/login/, forgot-password/                → authentification
  (dashboard)/
    admin/...                                    → écrans réservés SUPER_ADMIN/ADMIN/AGENT
    club/...                                      → écrans réservés CLUB_MANAGER
    layout.tsx                                    → sidebar + garde de rôle
  api/
    auth/[...nextauth]/route.ts
    licenses/, requests/, payments/, clubs/, athletes/, ...  → Route Handlers (thin controllers)
    cron/expire-licenses/route.ts                 → protégé par secret, appelé par le scheduler
    public/verify/[numero]/route.ts               → API publique, champs limités

lib/
  modules/
    licenses/{service.ts, repository.ts, schema.ts}
    requests/{...}
    payments/{...}
    clubs/{...}
    athletes/{...}
    users/{...}
    audit/{service.ts}                            → writeAuditLog(...)
    notifications/{service.ts}
    numbering/{service.ts}                        → generateRequestNumber(), generateLicenseNumber()
    storage/{provider.ts, local.ts, s3.ts}
    payments-gateway/{provider.ts}                → interface pour Wave/OM futurs
  auth/{authOptions.ts, permissions.ts}            → can(user, action, resource)
  db/{prisma.ts}
  jobs/{expireLicenses.ts, sendExpiryAlerts.ts}

prisma/
  schema.prisma
  seed.ts

scripts/
  worker.ts    → node-cron pour déploiement self-hosted (alternative au cron externe)

tests/
  unit/  (services)
  e2e/   (Playwright — workflow complet §68 du brief)
```

**Règle stricte** : un Route Handler ne fait que (1) authentifier/autoriser via `lib/auth/permissions.ts`,
(2) valider l'entrée via un schéma Zod, (3) appeler `lib/modules/*/service.ts`, (4) sérialiser la réponse.
Aucune requête Prisma directe dans `app/`. Aucune règle métier dans un composant React.

## 6. Rôles et permissions (RBAC + isolation club)

```
SUPER_ADMIN   > FEDERAL_ADMIN > AGENT
CLUB_MANAGER  → scope: son propre clubId uniquement
ATHLETE       → scope: son propre athleteId uniquement (P2, architecture prête dès le MVP)
```

Modèle appliqué :
- Chaque `User` a un `role` + éventuellement `clubId` (si CLUB_MANAGER) ou `athleteId` (si ATHLETE).
- Un helper central `can(session, action, resource)` dans `lib/auth/permissions.ts` est appelé
  **dans chaque fonction de service**, jamais seulement dans le middleware de route.
- Toute requête de lecture/écriture sur une ressource "club-scoped" (Athlete, LicenseRequest, License,
  Payment, Document) passe par un repository qui **injecte automatiquement le filtre `clubId`** dérivé
  de la session serveur — jamais d'un paramètre envoyé par le client. Un `CLUB_MANAGER` ne peut donc
  physiquement pas construire une requête retournant les données d'un autre club, même en modifiant
  l'URL ou le payload.
- Testé explicitement en E2E (§30/§42 du brief) : club A tente `GET /api/athletes/:id` d'un athlète du
  club B → 404 (pas 403, pour ne pas confirmer l'existence de la ressource).

## 7. Numérotation (demandes / licences)

Génération atomique via table `NumberSequence` : une transaction Prisma exécute
`UPDATE NumberSequence SET dernierNumero = dernierNumero + 1 WHERE type=... AND annee=... RETURNING dernierNumero`
(verrou de ligne Postgres implicite), garantissant l'unicité sous concurrence sans dépendre de l'ID
technique. Format : `REQ-{annee}-{numero:06d}`, `FSG-{annee}-{numero:06d}`.

## 8. Expiration et tâches planifiées

Un job `lib/jobs/expireLicenses.ts` :
1. Passe `ACTIVE → EXPIRED` toute licence dont `dateExpiration < now()`.
2. Calcule les licences à J-30/J-15/J-7 et crée les `Notification` correspondantes (club + admin).

Exécution : route `POST /api/cron/expire-licenses` protégée par un header secret (`CRON_SECRET`),
appelée quotidiennement par un scheduler externe (cron du VPS, Vercel Cron, ou GitHub Actions
schedule). Pour un déploiement self-hosted sans scheduler externe disponible, `scripts/worker.ts`
lance la même logique via `node-cron` en process séparé (`npm run worker`, géré par systemd/pm2).
La logique d'expiration ne dépend jamais du frontend.

## 9. Paiements

Entité `Payment` indépendante de `License` (jamais un simple booléen `paid`). Flux MVP : saisie
manuelle par le club (référence, montant, méthode, justificatif) → statut `PENDING` → vérification
par un admin → `VERIFIED`/`REJECTED`. Abstraction `PaymentGatewayProvider` (interface avec méthodes
`initiate()`, `verify()`, `handleWebhook()`) préparée pour Wave/Orange Money, **non implémentée** tant
qu'aucune clé API n'est configurée (voir §15 du brief — pas de simulation d'intégration réelle).

## 10. Documents et stockage

`Document` stocke uniquement les métadonnées + une `storageKey`. Le contenu binaire passe par
`StorageProvider` (interface) : `LocalStorageProvider` écrit sur disque (dev), `S3StorageProvider`
utilise l'API S3-compatible (Cloudflare R2 recommandé pour le coût). Bascule via variable d'env
`STORAGE_DRIVER=local|s3`.

## 11. QR Code et vérification publique

Chaque `License` avec statut `ACTIVE` génère un QR pointant vers
`https://<domaine>/verify-license/{numero}`. La page et l'API publique associée (`/api/public/verify/
[numero]`) ne retournent que : prénom/nom, club, discipline, catégorie, numéro, statut, dates
d'émission/expiration. Aucune donnée privée (email, tel, adresse, documents, infos médicales).

## 12. Sécurité

- Mots de passe : hash **bcrypt** (jamais en clair).
- Sessions : JWT signé (Auth.js), cookies `httpOnly`, `secure`, `sameSite=lax`.
- Permissions vérifiées côté serveur systématiquement (§6).
- Erreurs backend jamais exposées brutes : mapping vers messages métier (`lib/errors.ts`).
- Audit log sur toute action sensible (§31 du brief).
- Rate limiting sur `/api/auth/*` et `/api/public/verify/*`.

## 13. Performance

- Pagination backend obligatoire sur toutes les listes (curseur ou offset + `LIMIT`).
- Index Postgres sur les colonnes de filtre fréquentes (`clubId`, `statut`, `saisonId`, `dateExpiration`).
- KPI dashboard calculés via requêtes d'agrégation SQL (`GROUP BY`), jamais en récupérant puis en
  comptant côté application.
- Cache court (`unstable_cache` / revalidation Next.js) sur les KPI peu volatils (ex: totaux saison).

## 14. Déploiement

**Option recommandée (coût initial faible)** : Docker Compose sur un VPS unique
(Next.js app + PostgreSQL + volume pour stockage local ou MinIO). Coût ~5-10 USD/mois.

**Option évolutive** : Vercel (frontend+API) + Neon/Supabase (Postgres managé) + Cloudflare R2
(stockage). Bascule sans changement de code grâce aux abstractions (§9, §10).

Voir `.env.example` pour la configuration.

## 15. Évolutivité (hors périmètre MVP, mais non bloquée par l'architecture)

Le modèle `User` avec `role` extensible, les modules indépendants sous `lib/modules/`, et l'abstraction
storage/paiement permettent d'ajouter plus tard sans refonte : entraîneurs, arbitres/juges,
compétitions, inscriptions, application mobile (l'API REST existante devient directement consommable).

## 16. Risques identifiés

| Risque | Mitigation |
|---|---|
| Isolation club mal appliquée sur un nouvel endpoint | Repository centralisé imposant le filtre clubId + tests E2E dédiés |
| Génération de numéro dupliqué sous forte concurrence | Transaction Postgres avec verrou de ligne sur `NumberSequence` |
| Fuite de données privées via la page publique de vérification | DTO explicite dédié à l'API publique, jamais de sérialisation directe du modèle `License` |
| Site fesengym.com inaccessible lors de l'analyse (erreur TLS) | Direction artistique basée sur couleurs nationales + conventions FIG, à ajuster avec captures d'écran réelles — voir [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) |
| Dérive de scope (fonctionnalités P1/P2 mélangées au MVP) | Respect strict de la priorisation §67 du brief |
