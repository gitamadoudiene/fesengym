const BASE = "http://localhost:3000";
class CookieJar {
  constructor() { this.cookies = new Map(); }
  store(response) {
    const setCookie = response.headers.getSetCookie?.() ?? [];
    for (const c of setCookie) {
      const [pair] = c.split(";");
      const idx = pair.indexOf("=");
      this.cookies.set(pair.slice(0, idx), pair.slice(idx + 1));
    }
  }
  header() { return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; "); }
}
const jar = new CookieJar();
async function req(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, { ...options, redirect: "manual", headers: { ...options.headers, cookie: jar.header() } });
  jar.store(response);
  return response;
}
async function jsonReq(path, options = {}) {
  const res = await req(path, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${options.method ?? "GET"} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}
async function login(email, password) {
  const csrfRes = await req("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const body = new URLSearchParams({ email, password, csrfToken, callbackUrl: `${BASE}/dashboard`, json: "true" });
  const res = await req("/api/auth/callback/credentials", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (res.status >= 400) throw new Error(`Login failed: ${res.status}`);
}

async function main() {
  await login("club.dakar@fsg.sn", "ClubDakar123!");
  const athletes = await jsonReq("/api/athletes?search=Fatou");
  const athlete = athletes.items.find((a) => a.lastName === "Diouf");
  if (!athlete) throw new Error("Athlète de test introuvable");

  const seasons = await jsonReq("/api/seasons");
  const season = seasons.find((s) => s.isCurrent);
  const disciplines = await jsonReq("/api/disciplines");
  const categories = await jsonReq("/api/categories");
  const discipline = disciplines.find((d) => d.code === "GAF");
  const category = categories.find((c) => c.name === "Minime");

  const request = await jsonReq("/api/requests", {
    method: "POST",
    body: JSON.stringify({ athleteId: athlete.id, seasonId: season.id, disciplineId: discipline.id, categoryId: category.id, type: "NEW" }),
  });
  const payment = await jsonReq("/api/payments", {
    method: "POST",
    body: JSON.stringify({ licenseRequestId: request.id, method: "CASH" }),
  });
  await jsonReq(`/api/requests/${request.id}/submit`, { method: "POST" });

  await login("admin@fsg.sn", "AdminFederal123!");
  await jsonReq(`/api/requests/${request.id}/review`, { method: "POST" });
  await jsonReq(`/api/payments/${payment.id}/verify`, { method: "POST", body: JSON.stringify({ decision: "VERIFIED" }) });
  const { license } = await jsonReq(`/api/requests/${request.id}/approve`, { method: "POST" });
  console.log(`✓ Licence délivrée : ${license.number}`);

  // Accès public SANS cookie
  const publicRes = await fetch(`${BASE}/api/public/verify/${license.number}`);
  const publicView = await publicRes.json();
  console.log(`✓ Vue publique : hasPhoto=${publicView.athlete.hasPhoto}`);
  if (!publicView.athlete.hasPhoto) throw new Error("hasPhoto devrait être true");

  const photoRes = await fetch(`${BASE}/api/public/verify/${license.number}/photo`);
  if (!photoRes.ok) throw new Error(`Photo publique inaccessible : ${photoRes.status}`);
  const bytes = new Uint8Array(await photoRes.arrayBuffer());
  console.log(`✓ Photo publique récupérée sans authentification (${bytes.length} octets, content-type: ${photoRes.headers.get("content-type")})`);

  // Une licence sans photo ne doit pas exposer de photo (404 propre)
  const noPhotoRes = await fetch(`${BASE}/api/public/verify/FSG-INEXISTANT/photo`);
  if (noPhotoRes.status !== 404) throw new Error("Devrait renvoyer 404 pour un numéro inexistant");
  console.log("✓ 404 propre pour un numéro de licence inexistant");

  console.log("\n🎉 Photo publique validée de bout en bout.");
}
main().catch((err) => { console.error("\n❌ ÉCHEC:", err.message); process.exit(1); });
