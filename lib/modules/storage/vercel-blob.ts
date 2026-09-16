import "server-only";
import { put, del } from "@vercel/blob";
import type { StorageProvider, StoredFile } from "./provider";

/**
 * Vercel Blob n'offre que des URLs publiques (pas d'ACL privée) — voir
 * DECISIONS.md. Le "key" stocké est directement l'URL publique retournée
 * par Blob, mais elle n'est JAMAIS renvoyée telle quelle au client : tout
 * téléchargement passe par /api/documents/[id], qui vérifie les
 * permissions puis relit et relaie le contenu (voir documents/service.ts).
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
      access: "public",
      contentType: mimeType,
      addRandomSuffix: true,
    });
    return { key: blob.url };
  }

  async read(key: string): Promise<Buffer> {
    const response = await fetch(key);
    if (!response.ok) throw new Error(`Impossible de lire le fichier (${response.status}).`);
    return Buffer.from(await response.arrayBuffer());
  }

  async delete(key: string): Promise<void> {
    await del(key).catch(() => undefined);
  }
}
