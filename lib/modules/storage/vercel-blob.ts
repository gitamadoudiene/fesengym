import "server-only";
import { put, get, del } from "@vercel/blob";
import type { StorageProvider, StoredFile } from "./provider";

/**
 * Store Vercel Blob configuré en accès **privé** (voir DECISIONS.md D5/D15) :
 * contrairement à un store public, un blob privé ne peut pas être lu par une
 * simple requête HTTP sur son URL — il faut passer par `get(pathname,
 * {access:'private'})` avec les identifiants du projet (OIDC + BLOB_STORE_ID,
 * ou BLOB_READ_WRITE_TOKEN). C'est strictement mieux pour des documents
 * sensibles (certificats médicaux, pièces d'identité) que l'ancienne
 * approche "URL publique mais jamais communiquée au client".
 */
export class VercelBlobStorageProvider implements StorageProvider {
  async save({
    key,
    buffer,
    mimeType,
  }: {
    key: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<StoredFile> {
    const blob = await put(key, buffer, {
      access: "private",
      contentType: mimeType,
      addRandomSuffix: true,
    });
    // `pathname` reflète le nom réellement stocké (avec le suffixe aléatoire)
    // — c'est cette valeur qu'il faut repasser à get()/del(), pas `key`.
    return { key: blob.pathname };
  }

  async read(key: string): Promise<Buffer> {
    const result = await get(key, { access: "private" });
    if (!result?.stream) {
      throw new Error("Fichier introuvable dans le stockage Blob.");
    }
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.stream as unknown as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await del(key).catch(() => undefined);
  }
}
