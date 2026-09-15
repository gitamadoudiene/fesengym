/**
 * Test de fumée du workflow complet, via HTTP contre le serveur dev local.
 * Usage : node scripts/smoke-test.mjs
 * Non versionné dans le workflow normal — outil de vérification ponctuelle.
 */
const BASE = "http://localhost:3000";

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }
  store(response) {
    const setCookie = response.headers.getSetCookie?.() ?? [];
    for (const c of setCookie) {
      const [pair] = c.split(";");
      const idx = pair.indexOf("=");
      this.cookies.set(pair.slice(0, idx), pair.slice(idx + 1));
    }
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

const jar = new CookieJar();

async function req(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    redirect: "manual",
    headers: {
      ...options.headers,
      cookie: jar.header(),
    },
  });
  jar.store(response);
  return response;
}

async function login(email, password) {
  const csrfRes = await req("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();

  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${BASE}/dashboard`,
    json: "true",
  });

  const res = await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (res.status >= 400) {
    throw new Error(`Login failed for ${email}: ${res.status}`);
  }
  console.log(`✓ Connecté : ${email}`);
}

async function jsonReq(path, options = {}) {
  const res = await req(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  // 1. Connexion en tant que responsable de club (Dakar Gym Club)
  await login("club.dakar@fsg.sn", "ClubDakar123!");

  // 2. Créer un athlète
  const athlete = await jsonReq("/api/athletes", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Mamadou",
      lastName: "Ndiaye",
      dateOfBirth: "2010-05-12",
      sex: "M",
      nationality: "Sénégalaise",
    }),
  });
  console.log(`✓ Athlète créé : ${athlete.firstName} ${athlete.lastName} (${athlete.id})`);

  // 3. Détection de doublon
  const dup = await jsonReq(
    `/api/athletes/duplicates?firstName=Mamadou&lastName=Ndiaye&dateOfBirth=2010-05-12`,
  );
  if (dup.length !== 1) throw new Error("Détection de doublon incorrecte");
  console.log(`✓ Détection de doublon fonctionnelle (${dup.length} correspondance)`);

  // 4. Récupérer saison courante + discipline + catégorie
  const seasons = await jsonReq("/api/seasons");
  const currentSeason = seasons.find((s) => s.isCurrent);
  if (!currentSeason) throw new Error("Pas de saison courante");
  const disciplines = await jsonReq("/api/disciplines");
  const categories = await jsonReq("/api/categories");
  const discipline = disciplines.find((d) => d.code === "GAM");
  const category = categories.find((c) => c.name === "Cadet");
  if (!discipline || !category) throw new Error("Référentiel manquant");

  // 5. Créer une demande
  const request = await jsonReq("/api/requests", {
    method: "POST",
    body: JSON.stringify({
      athleteId: athlete.id,
      seasonId: currentSeason.id,
      disciplineId: discipline.id,
      categoryId: category.id,
      type: "NEW",
    }),
  });
  console.log(`✓ Demande créée : ${request.number} (statut ${request.status})`);

  // 6. Enregistrer le paiement
  const payment = await jsonReq("/api/payments", {
    method: "POST",
    body: JSON.stringify({
      licenseRequestId: request.id,
      method: "WAVE",
      transactionReference: "TX-TEST-001",
    }),
  });
  console.log(`✓ Paiement enregistré : ${payment.reference} — ${payment.amount} ${payment.currency}`);

  // 7. Soumettre la demande
  const submitted = await jsonReq(`/api/requests/${request.id}/submit`, { method: "POST" });
  console.log(`✓ Demande soumise (statut ${submitted.status})`);

  // 8. Isolation club : vérifier que le club de Thiès NE PEUT PAS voir cet athlète
  await login("club.thies@fsg.sn", "ClubThies123!");
  const isolationRes = await req(`/api/athletes/${athlete.id}`);
  if (isolationRes.status !== 404) {
    throw new Error(
      `FAILLE D'ISOLATION : le club de Thiès a reçu le statut ${isolationRes.status} au lieu de 404`,
    );
  }
  console.log("✓ Isolation club vérifiée : club B ne peut pas accéder à un athlète du club A (404)");

  // 9. Connexion admin fédéral : vérifier le paiement puis passer en revue
  await login("admin@fsg.sn", "AdminFederal123!");
  await jsonReq(`/api/requests/${request.id}/review`, { method: "POST" });
  console.log("✓ Vérification démarrée par l'admin fédéral");

  await jsonReq(`/api/payments/${payment.id}/verify`, {
    method: "POST",
    body: JSON.stringify({ decision: "VERIFIED" }),
  });
  console.log("✓ Paiement vérifié");

  // 10. Valider la demande -> génère la licence
  const { request: approvedRequest, license } = await jsonReq(
    `/api/requests/${request.id}/approve`,
    { method: "POST" },
  );
  console.log(`✓ Demande validée (statut ${approvedRequest.status})`);
  console.log(`✓ Licence délivrée : ${license.number}, expire le ${license.expiresAt}`);

  // 11. Vérification publique (sans authentification)
  jar.cookies.clear();
  const publicView = await jsonReq(`/api/public/verify/${license.number}`);
  console.log(
    `✓ Vérification publique OK : ${publicView.athlete.firstName} ${publicView.athlete.lastName} — statut ${publicView.status}`,
  );
  if (publicView.email || publicView.phone) {
    throw new Error("FUITE DE DONNÉES : la vue publique expose des champs privés");
  }
  console.log("✓ Aucune donnée privée exposée dans la vue publique");

  console.log("\n🎉 Workflow complet validé de bout en bout.");
}

main().catch((err) => {
  console.error("\n❌ ÉCHEC:", err.message);
  process.exit(1);
});
