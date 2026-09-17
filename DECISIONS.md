# DECISIONS.md — Journal des décisions techniques

Chaque décision suit le format : Contexte / Options considérées / Décision / Raison.

---

## D1 — Base de données : PostgreSQL plutôt que MongoDB

**Contexte** : le domaine relie fortement Club, Athlète, Saison, Discipline, Catégorie, Demande,
Paiement, Licence. De nombreuses requêtes sont des agrégations transverses (KPI dashboard,
statistiques par club/discipline/saison).

**Options** : PostgreSQL, MySQL, MongoDB.

**Décision** : PostgreSQL.

**Raison** : les relations sont fortes et les contraintes d'intégrité critiques (numéro de licence
unique, une seule saison courante, un club ne voit que ses données). Un SGBD relationnel avec
contraintes `UNIQUE`, `FOREIGN KEY`, index partiels et transactions ACID applique ces règles au niveau
base de données plutôt que de les recréer en code applicatif (source d'incohérences). MongoDB
conviendrait à des documents peu reliés entre eux (ex: logs bruts) — ce n'est pas le cas ici. Entre
PostgreSQL et MySQL, PostgreSQL offre des index partiels (utile pour `estCourante` unique), un typage
JSONB solide (métadonnées d'audit) et un meilleur support des extensions (recherche full-text pour la
recherche globale §57).

---

## D2 — Framework : Next.js (monolithe) plutôt que NestJS + SPA séparée

**Contexte** : besoin d'une séparation claire logique métier / API / UI / auth (§44 du brief), mais
aussi de simplicité de déploiement et de coût faible (§3 du brief).

**Options** : (a) NestJS (API) + React/Vite (SPA) déployés séparément ; (b) Next.js App Router
(monolithe modulaire) ; (c) Laravel (PHP) + Blade/Inertia.

**Décision** : Next.js App Router, TypeScript, avec séparation en couches imposée par convention
(`app/` = contrôleurs fins, `lib/modules/*` = logique métier, jamais l'inverse).

**Raison** : un seul runtime Node, un seul déploiement, un seul langage (TypeScript de bout en bout,
partage des schémas Zod entre client et serveur). NestJS apporterait une structure DI plus explicite,
mais au prix de deux services à déployer, deux pipelines CI, et une duplication des types
frontend/backend — coût opérationnel non justifié pour une fédération qui doit maîtriser ses coûts
d'hébergement (§3, §47). La rigueur de séparation est obtenue par convention de code et revue, pas
par la contrainte du framework. Laravel a été écarté car l'équipe cible et l'écosystème de composants
(shadcn/ui, Recharts) sont plus riches et rapides à produire en React/TypeScript pour ce type
d'interface data-dense.

---

## D3 — ORM : Prisma

**Contexte** : besoin de migrations fiables, de types générés automatiquement, de transactions pour
la numérotation atomique.

**Décision** : Prisma.

**Raison** : génération de types TypeScript à partir du schéma (réduit les erreurs de champ), système
de migrations versionnées lisible (`prisma/migrations`), support natif des transactions et des index
partiels PostgreSQL. Alternative (Drizzle) est plus légère mais moins mature sur les migrations
guidées ; écartée pour privilégier la stabilité sur un projet destiné à durer.

---

## D4 — Authentification : Auth.js (NextAuth v5) avec credentials + JWT

**Contexte** : besoin de connexion email/mot de passe, rôles, sessions, protection de routes ;
pas de besoin de SSO/OAuth grand public pour une fédération.

**Décision** : Auth.js, provider Credentials, sessions JWT (cookie httpOnly), bcrypt pour le hash.

**Raison** : solution éprouvée, intégrée nativement à Next.js middleware, évite de réimplémenter
gestion de session/CSRF. Un système fait maison serait un risque de sécurité injustifié (§28 du
brief demande des mécanismes modernes).

---

## D5 — Stockage fichiers : abstraction StorageProvider (local dev / Vercel Blob prod)

**Contexte** : §26 du brief interdit de stocker les fichiers en base et impose une abstraction. Le
projet étant déployé sur Vercel (voir D12), Cloudflare R2 initialement envisagé aurait ajouté un
fournisseur et des identifiants supplémentaires à configurer manuellement.

**Décision** : interface `StorageProvider` avec deux implémentations : `LocalStorageProvider`
(disque local, développement uniquement — système de fichiers éphémère en serverless) et
`VercelBlobStorageProvider` (`@vercel/blob`, provisionné en un clic depuis l'onglet Storage du
projet Vercel, comme la base de données).

**Contrainte de sécurité importante** : Vercel Blob ne propose que des URLs **publiques** (pas
d'ACL privée). Pour des documents sensibles (certificats médicaux, pièces d'identité, statuts de
club), l'URL Blob n'est donc **jamais renvoyée au client** : `Document.storageKey` la conserve
côté serveur uniquement, et tout téléchargement passe par la route authentifiée et vérifiée par
permission `/api/documents/[id]`, qui relit le fichier et le relaie (voir
`lib/modules/storage/vercel-blob.ts` et `lib/modules/documents/service.ts`).

**Raison** : cohérence avec le choix d'hébergement (un seul écosystème à configurer), coût nul à
l'usage prévu, et la contrainte d'URL publique est neutralisée par le proxy d'accès plutôt que par
le fournisseur de stockage lui-même — ce qui reste vrai même si le fournisseur change plus tard.

---

## D6 — Paiements : entité `Payment` dédiée, pas de simulation de provider en ligne

**Contexte** : §14/§15 du brief interdit `paid: true` sur la licence et interdit de simuler une
intégration réelle sans API configurée.

**Décision** : `Payment` comme entité de premier ordre avec son propre cycle de statut
(`PENDING → PAID/VERIFIED` ou `FAILED/REJECTED/REFUNDED`), vérifiée manuellement par un admin au
MVP. Une interface `PaymentGatewayProvider` est définie mais aucune implémentation Wave/Orange Money
n'est codée tant qu'aucune clé API n'est fournie par la FSG.

**Raison** : coder un faux appel à l'API Wave donnerait une fausse impression de fonctionnalité et
masquerait un vrai risque en production. L'abstraction permet de brancher le vrai provider plus tard
sans toucher au reste du système (demandes, licences, notifications).

---

## D7 — Génération des numéros : table de séquence + transaction, pas l'ID technique

**Contexte** : §32 interdit d'exposer l'ObjectId/UUID comme numéro visible et exige l'unicité sous
requêtes simultanées.

**Décision** : table `NumberSequence(type, annee, dernierNumero)` incrémentée via
`UPDATE ... RETURNING` dans une transaction Prisma.

**Raison** : `UPDATE` sur une ligne existante prend un verrou de ligne Postgres implicite ; deux
requêtes concurrentes sont sérialisées par la base sans nécessiter de verrou applicatif ou de
mécanisme externe (Redis, etc.), ce qui reste simple et fiable pour le volume attendu (des centaines
à quelques milliers de licences par saison).

---

## D8 — Tâches planifiées : route API sécurisée + worker optionnel, pas de dépendance à un service tiers obligatoire

**Contexte** : §16 exige un mécanisme d'expiration côté backend indépendant du frontend, sans stack
imposée.

**Décision** : logique d'expiration centralisée dans `lib/jobs/`, déclenchée par une route
`/api/cron/*` protégée par secret. En self-host, un script `scripts/worker.ts` (node-cron) peut
l'appeler en interne ; en hébergement managé, un cron externe (Vercel Cron, cron système, GitHub
Actions) suffit.

**Raison** : ne pas coupler l'architecture à un fournisseur de cron spécifique tout en gardant une
solution qui fonctionne aussi bien en VPS Docker qu'en plateforme serverless.

---

## D9 — UI : Tailwind CSS + shadcn/ui plutôt qu'une librairie de composants "prête à l'emploi" (MUI, Ant Design)

**Contexte** : §34/§70 du brief exigent explicitement d'éviter un rendu "template IA"/dashboard
générique et de coller à une identité propre à la FSG.

**Décision** : Tailwind CSS + composants shadcn/ui (code source copié dans le repo, pas une
dépendance boîte noire) comme fondation, entièrement re-thémée via les tokens définis dans
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).

**Raison** : MUI/Ant Design imposent une identité visuelle reconnaissable (Material Design, style
Ant) difficile à masquer complètement, ce qui contredit l'exigence d'identité propre. shadcn/ui
fournit des primitives accessibles (Radix) sans imposer de style — le style vient à 100% des tokens
du design system du projet.

---

## D10 — Recherche du site fesengym.com inaccessible pendant l'analyse

**Contexte** : le brief demande explicitement de consulter https://fesengym.com/ avant de concevoir
le design.

**Constat** : le site retourne une erreur TLS (`SSL_ALERT_INTERNAL_ERROR`) aussi bien via le
navigateur intégré que via un fetch direct au moment de l'analyse (2026-09-12) — probablement un
certificat expiré ou une mauvaise configuration côté hébergeur du site, pas un blocage de notre côté.

**Décision** : construire une direction artistique de départ à partir (a) des informations
disponibles sur la FSG via recherche web (couverture des disciplines Aérobic/GAF/GAM/Gym pour
tous/GR/Parkour/Trampoline, siège au Stade Iba Mar Diop, Dakar), (b) des couleurs du drapeau
sénégalais comme base institutionnelle nationale, (c) des conventions visuelles des fédérations de
gymnastique internationales (FIG) pour l'univers sportif. Cette base est documentée comme un point de
départ explicitement révisable.

**Raison** : bloquer tout le projet en attendant que le site redevienne accessible n'est pas
raisonnable. Le design system (voir [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)) est structuré en tokens
centralisés précisément pour pouvoir être recalibré en une seule fois dès que des captures d'écran
réelles du site seront disponibles, sans refonte des composants.

---

## D11 — Statut de la demande vs statut du paiement : ne pas dupliquer l'état

**Contexte** : le brief §12 propose un workflow `SUBMITTED → UNDER_REVIEW → PAYMENT_PENDING →
PAYMENT_VERIFICATION → APPROVED`, tout en insistant ailleurs (§14, §61 règle 12) sur le fait que le
statut d'une licence/demande et le statut d'un paiement ne doivent jamais être mélangés.

**Décision** : `LicenseRequest.status` conserve les valeurs `PAYMENT_PENDING`/`PAYMENT_VERIFICATION`
dans son enum (pour compatibilité et requêtes futures), mais le workflow implémenté ne transite pas
activement par ces deux valeurs. La progression réelle est : `DRAFT → SUBMITTED → UNDER_REVIEW →
(CORRECTION_REQUESTED → SUBMITTED)* → APPROVED/REJECTED`, et l'état du paiement est suivi
exclusivement via `Payment.status` (`PENDING/PAID/VERIFIED/REJECTED/...`). `approveRequest()` exige
explicitement qu'un paiement `VERIFIED` existe avant de délivrer la licence — la contrainte métier du
brief (§21 : vérifier le paiement avant validation) est donc bien appliquée, sans dupliquer
l'information dans deux machines à états distinctes.

**Raison** : maintenir deux statuts qui doivent rester synchronisés (le statut de la demande ET le
statut du paiement) est une source classique d'incohérence (que faire si le paiement est rejeté après
que la demande soit passée en `PAYMENT_VERIFICATION` ?). Une seule source de vérité par préoccupation
(le paiement pour l'argent, la demande pour le dossier) est plus robuste et plus simple à auditer.

---

## D12 — Déploiement réel : Vercel + Prisma Postgres (plutôt que VPS/Neon prévus initialement)

**Contexte** : ARCHITECTURE.md §14 recommandait un VPS Docker ou Vercel + Neon. En pratique,
l'utilisateur a déployé via l'intégration native de Vercel ("Prisma Postgres", proposée directement
dans l'assistant de création de projet), sans étape Neon séparée.

**Décision** : conserver Vercel + Prisma Postgres comme cible de déploiement documentée. Le
connecteur reste du PostgreSQL standard (`postgresql://`) via Prisma — aucune adhérence de code à
Neon spécifiquement, donc aucun changement requis dans le code applicatif.

**Raison** : c'est le chemin que la fédération a effectivement suivi et qui fonctionne ; documenter
la réalité plutôt qu'un plan non exécuté. Un incident de configuration a été rencontré et corrigé au
passage : les variables d'environnement (`AUTH_SECRET`, `CRON_SECRET`, etc.) doivent être cochées
pour l'environnement **Production** dans Vercel, pas seulement Development — sinon Auth.js échoue
avec une erreur de configuration générique (`MissingSecret`/`UntrustedHost`) sur toutes les routes
`/api/auth/*`.

---

## D13 — Auto-inscription des clubs : compte actif immédiatement, capacités bloquées jusqu'à validation

**Contexte** : le produit devait évoluer pour permettre à un club de s'inscrire lui-même (au lieu
d'être créé uniquement par un administrateur) et de soumettre une demande d'adhésion avec pièces
justificatives.

**Décision** : `Club.status` gagne les valeurs `PENDING` (par défaut à l'auto-inscription) et
`REJECTED`. Le compte `CLUB_MANAGER` associé est créé `ACTIVE` et peut se connecter immédiatement,
mais toute action de libre-service (créer un athlète, une demande, un paiement) est bloquée tant que
`Club.status !== "ACTIVE"`, via `assertClubActiveForSelfService()` appelée dans chaque service
concerné — jamais uniquement dans l'interface.

**Raison** : permettre au club de suivre l'état de sa demande (voir son tableau de bord, ses
documents soumis) sans lui laisser croire qu'il peut déjà opérer, tout en gardant l'isolation et les
contrôles de sécurité existants intacts (la vérification se fait au niveau service, pas au niveau
route ou UI).

---

## D14 — Recalibrage du design system sur le vrai site (2026-09-16)

**Contexte** : fesengym.com restait injoignable, mais l'utilisateur a fourni un miroir fonctionnel
du site (hébergé temporairement sur Hostinger) permettant une inspection réelle des styles calculés.

**Constat** : palette réelle = vert profond `#1F4B3F` (hero, footer) + vert clair `#5BBB7B` (CTA/
accent) — pas de jaune/or comme supposé initialement par analogie avec le drapeau. Police unique
`DM Sans` partout (titres compris), pas de duo de polices. Structure de page d'accueil : hero sombre
plein écran avec recherche + statistiques inline, séparation par une courbe blanche, sections
alternant fond blanc/gris clair, cartes à coins arrondis avec image en tête.

**Décision** : palette et police mises à jour dans `app/globals.css` (voir D5/D9), page d'accueil
publique reconstruite pour refléter cette structure (hero sombre + stats réelles de la plateforme +
courbe de séparation + sections alternées), sans reprendre le contenu spécifique du site public
(actualités, annuaire de clubs avec notation, boutique) qui n'a pas sa place dans l'outil de gestion.

**Raison** : le brief demande explicitement une cohérence visuelle avec fesengym.com plutôt qu'une
identité inventée par déduction. Une fois une source réelle disponible, la corriger prime sur la
cohérence avec la version précédente.
