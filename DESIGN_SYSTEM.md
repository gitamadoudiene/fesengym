# DESIGN_SYSTEM.md — Identité visuelle FSG Gestion

> **Note de transparence** : fesengym.com était injoignable au moment de cette analyse (erreur TLS
> côté serveur — voir [DECISIONS.md § D10](DECISIONS.md#d10)). Cette base est construite à partir des
> couleurs institutionnelles sénégalaises, des conventions visuelles des fédérations de gymnastique
> (FIG) et des informations publiques sur la FSG (disciplines couvertes, ancrage à Dakar). Tout est
> centralisé en tokens pour permettre un recalibrage rapide dès que le site sera consultable — à
> refaire en priorité dès que possible plutôt que de considérer cette base comme définitive.

## 1. Principes directeurs

- **Institutionnel avant sportif** : c'est un outil de gestion utilisé quotidiennement par des
  administrateurs et des responsables de club — la lisibilité prime sur l'effet visuel.
- **Sportif avant générique** : couleurs, ton et quelques éléments graphiques rappellent la
  gymnastique et le Sénégal, pour ne jamais ressembler à un SaaS financier interchangeable.
- **Les couleurs de statut sont indépendantes de l'identité de marque** (vert institutionnel ≠ vert
  "succès").

## 2. Palette (tokens)

```css
/* Marque */
--color-primary:        #0B6E4F;  /* vert institutionnel profond (drapeau sénégalais, assombri pour usage UI) */
--color-primary-hover:  #095A40;
--color-primary-light:  #E6F3EE;  /* fonds teintés, badges */

--color-secondary:      #C79A2B;  /* or/jaune institutionnel, assombri pour rester lisible en texte */
--color-secondary-hover:#A67F1F;

--color-accent:         #1F2933;  /* anthracite — utilisé pour contrastes forts, pas le rouge du drapeau
                                      (réservé aux statuts d'erreur, pour éviter toute ambiguïté) */

/* Neutres */
--color-background:     #F7F8F6;  /* fond général, légèrement chaud */
--color-surface:        #FFFFFF;
--color-surface-muted:  #F1F3F1;
--color-border:         #E2E5E1;
--color-text:           #1A1F1C;
--color-text-muted:     #5B6660;

/* États (indépendants de la marque) */
--color-success:        #1E8E5A;
--color-success-bg:     #E7F6EE;
--color-warning:        #B9770E;
--color-warning-bg:     #FDF3E3;
--color-danger:         #C0392B;
--color-danger-bg:      #FBEAE8;
--color-info:           #2563A6;
--color-info-bg:        #E8F1FA;

/* Mode sombre (sidebar/topbar uniquement, pas toute l'app) */
--color-dark-surface:   #10241C;
--color-dark-surface-2: #163429;
--color-dark-text:      #EAF2EE;
--color-dark-text-muted:#9DB3AA;
```

Le vert reste la couleur d'autorité (boutons primaires, liens actifs, sidebar). L'or est réservé aux
accents ponctuels (mise en avant d'un chiffre clé, bordure de carte "licence", hover secondaire) —
jamais en grande surface, pour ne pas alourdir l'interface.

## 3. Typographie

- **Titres / chiffres clés** : `Manrope` (600–800) — géométrique, moderne, bonne présence pour les
  gros nombres du dashboard.
- **Texte UI / tableaux / formulaires** : `Inter` (400–600) — excellente lisibilité en petite taille,
  chiffres tabulaires (`font-variant-numeric: tabular-nums`) pour l'alignement des colonnes numériques.
- Chargement via Google Fonts (`fonts.googleapis.com`), fallback système
  (`-apple-system, Segoe UI, Roboto, sans-serif`).

Échelle :
```
display   32/40  Manrope 700   → en-tête de page, KPI principal
h1        24/32  Manrope 700   → titre de section
h2        18/28  Manrope 600   → titre de carte
body      14/20  Inter 400     → texte courant, tableaux
label     12/16  Inter 600     → labels de formulaire, en-têtes de colonnes (uppercase, tracking large)
caption   11/16  Inter 400     → texte secondaire, métadonnées
kpi       28/32  Manrope 800   → valeur chiffrée d'une carte KPI
```

## 4. Composants clés

**Boutons** — coins arrondis modérés (`radius-md` = 8px), pas de pilule complète (trop "startup"),
pas d'angle droit (trop "admin générique").
- Primaire : fond `--color-primary`, texte blanc, hover `--color-primary-hover`.
- Secondaire : bordure `--color-border`, fond `--color-surface`, texte `--color-text`.
- Destructif : fond `--color-danger`, réservé aux actions de rejet/suppression, toujours avec
  confirmation (§65 du brief).
- État de chargement : spinner inline + texte inchangé (pas de changement de largeur du bouton).

**Cartes KPI** — fond blanc, bordure `--color-border` fine, coin supérieur gauche avec un liseré de
2px dans la couleur du domaine (vert = licences, or = clubs, anthracite = paiements). Valeur en
`kpi`, libellé en `label` au-dessus, variation (vs saison précédente) en petit texte coloré
success/danger sous la valeur.

**Badges de statut** — pastille pleine + texte, jamais de couleur seule (accessibilité) :
```
● Active            success
● En attente        warning
● À vérifier        info
● Expire bientôt    warning (avec icône horloge)
● Expirée           danger
● Suspendue         danger (icône différente : pause)
● Rejetée           danger (icône différente : croix)
```

**Tableaux** — en-têtes en `label` (majuscules, `--color-text-muted`), lignes zébrées très légères
(`--color-surface-muted` une ligne sur deux), hover de ligne `--color-primary-light`, actions
contextuelles regroupées dans un menu "⋯" en fin de ligne plutôt que des boutons multiples. Colonnes
numériques alignées à droite avec `tabular-nums`.

**Sidebar** — fond sombre (`--color-dark-surface`), largeur compacte (~248px), logo FSG en haut,
badge "Saison 2026-2027" sous le logo, navigation groupée par section (LICENCES / ACTEURS / SPORT /
FINANCES / ADMINISTRATION), item actif surligné avec un liseré vertical `--color-secondary`
(accent or, discret). Bloc utilisateur + déconnexion en bas, séparé par une bordure.

**Carte de licence** (fiche licence, export) — ratio proche d'une carte officielle (format paysage
~85.6×54mm à l'échelle écran), fond blanc avec bande verte en haut portant le logo FSG et "LICENCE
2026-2027", photo athlète à gauche, informations à droite (nom, club, discipline, catégorie, numéro),
QR code en bas à droite avec la mention "Scanner pour vérifier" — le QR a une fonction explicite, pas
un simple ornement.

**Page de vérification publique** — centrée, fond `--color-background`, logo FSG en haut, statut
affiché en très grand avec icône et couleur (✓ vert / ✕ rouge / ⚠ orange), carte blanche avec les
informations non sensibles, QR affiché en petit sous les infos pour référence. Aucune navigation,
aucun lien vers le reste de l'application.

**Formulaires multi-étapes** (demande de licence) — indicateur d'étapes horizontal en haut
(numéro cerclé + libellé), étape active en `--color-primary`, étapes complétées avec coche verte,
étapes futures en gris. Un seul groupe de champs visible à la fois.

**États vides** — icône ligne simple (pas d'illustration complexe), titre `h2`, description `body`
en `--color-text-muted`, action principale en bouton primaire quand pertinent
(ex. "Créer une demande").

## 5. Espacements et grille

Échelle en base 4 : `4, 8, 12, 16, 24, 32, 48, 64`. Rayon de bordure standard `8px` (cartes, inputs),
`6px` (badges), `12px` (modales). Ombre unique et discrète pour les cartes flottantes
(`0 1px 2px rgba(16,24,20,.06), 0 4px 12px rgba(16,24,20,.04)`) — pas d'ombres multiples ou colorées.

## 6. Responsive

- **Desktop** : sidebar fixe, tableaux complets, dashboard en grille 3-4 colonnes.
- **Tablette** : sidebar rétractable en icônes, tableaux avec scroll horizontal contenu (jamais le
  body qui scrolle horizontalement).
- **Mobile** (priorité à l'espace club, §62 du brief) : sidebar en drawer, tableaux transformés en
  liste de cartes (une carte = une ligne, champs principaux visibles, "⋯" pour le détail), actions
  principales en bas d'écran sous forme de bouton pleine largeur sticky.

## 7. Accessibilité

Contraste texte/fond ≥ 4.5:1 vérifié sur chaque token (le vert primaire sur blanc atteint ~5.9:1, le
texte blanc sur vert primaire ~5.9:1 également). Focus visible (`outline: 2px solid var(--color-secondary)`
+ offset) sur tous les éléments interactifs. Aucune information portée uniquement par la couleur
(badges = couleur + icône + texte).

## 8. À faire dès que fesengym.com est accessible

Recalibrer uniquement les valeurs de tokens (§2–3) à partir de captures d'écran réelles — la
structure des composants (§4) n'a pas besoin de changer, seulement leurs couleurs/typo exactes.
