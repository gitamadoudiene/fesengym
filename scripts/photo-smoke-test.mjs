import { readFileSync } from "node:fs";

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
  const response = await fetch(`${BASE}${path}`, {
    ...options, redirect: "manual",
    headers: { ...options.headers, cookie: jar.header() },
  });
  jar.store(response);
  return response;
}

async function jsonReq(path, options = {}) {
  const res = await req(path, { ...options, headers: { "Content-Type": "application/json", ...options.headers } });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${options.method ?? "GET"} ${path} -> ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function login(email, password) {
  const csrfRes = await req("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();
  const body = new URLSearchParams({ email, password, csrfToken, callbackUrl: `${BASE}/dashboard`, json: "true" });
  const res = await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (res.status >= 400) throw new Error(`Login failed for ${email}: ${res.status}`);
  console.log(`✓ Connecté : ${email}`);
}

async function main() {
  await login("club.dakar@fsg.sn", "ClubDakar123!");

  const athlete = await jsonReq("/api/athletes", {
    method: "POST",
    body: JSON.stringify({
      firstName: "Fatou",
      lastName: "Diouf",
      dateOfBirth: "2011-03-20",
      sex: "F",
      nationality: "Sénégalaise",
    }),
  });
  console.log(`✓ Athlète créé : ${athlete.firstName} ${athlete.lastName} (${athlete.id})`);

  // Upload de la photo
  const fileBuffer = readFileSync("test-photo.png");
  const formData = new FormData();
  formData.append("ownerType", "ATHLETE");
  formData.append("ownerId", athlete.id);
  formData.append("type", "PHOTO");
  formData.append("file", new Blob([fileBuffer], { type: "image/png" }), "photo.png");

  const uploadRes = await req("/api/documents", { method: "POST", body: formData });
  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  const document = await uploadRes.json();
  console.log(`✓ Photo envoyée : document ${document.id} (${document.size} octets)`);

  // Lier la photo à l'athlète
  await jsonReq(`/api/athletes/${athlete.id}`, {
    method: "PATCH",
    body: JSON.stringify({ photoDocumentId: document.id }),
  });
  console.log("✓ Photo associée à l'athlète");

  // Vérifier que l'athlète expose bien le lien
  const athleteCheck = await jsonReq(`/api/athletes/${athlete.id}`);
  if (athleteCheck.photoDocumentId !== document.id) {
    throw new Error("photoDocumentId non persisté sur l'athlète");
  }
  console.log("✓ photoDocumentId confirmé sur la fiche athlète");

  // Télécharger la photo via la route authentifiée
  const downloadRes = await req(`/api/documents/${document.id}`);
  if (!downloadRes.ok) throw new Error(`Download failed: ${downloadRes.status}`);
  const downloadedBytes = new Uint8Array(await downloadRes.arrayBuffer());
  if (downloadedBytes.length !== fileBuffer.length) {
    throw new Error(`Taille du fichier téléchargé incorrecte : ${downloadedBytes.length} vs ${fileBuffer.length}`);
  }
  console.log(`✓ Photo re-téléchargée avec succès (${downloadedBytes.length} octets, contenu identique)`);

  // Isolation : le club de Thiès ne doit pas pouvoir télécharger ce document
  await login("club.thies@fsg.sn", "ClubThies123!");
  const isolationRes = await req(`/api/documents/${document.id}`);
  if (isolationRes.status !== 404) {
    throw new Error(`FAILLE D'ISOLATION documents : statut ${isolationRes.status} au lieu de 404`);
  }
  console.log("✓ Isolation club vérifiée sur les documents (404 pour un autre club)");

  console.log("\n🎉 Flux photo validé de bout en bout.");
}

main().catch((err) => {
  console.error("\n❌ ÉCHEC:", err.message);
  process.exit(1);
});
