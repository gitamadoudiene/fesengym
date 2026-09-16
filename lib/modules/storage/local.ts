import "server-only";
import { mkdir, writeFile, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, StoredFile } from "./provider";

/**
 * Stockage disque local — développement uniquement. Ne PAS utiliser en
 * production sur une plateforme serverless (système de fichiers éphémère,
 * voir DECISIONS.md).
 */
export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root = process.env.LOCAL_STORAGE_PATH || "./storage") {
    // Dev-only provider — jamais utilisée quand STORAGE_DRIVER=vercel-blob
    // (voir index.ts). L'ignore évite que Turbopack ne trace tout le projet
    // à cause de ce chemin dynamique, alors que ce code ne s'exécute jamais
    // en production.
    this.root = path.resolve(/* turbopackIgnore: true */ process.cwd(), root);
  }

  async save({ key, buffer }: { key: string; buffer: Buffer; mimeType: string }): Promise<StoredFile> {
    const filePath = path.join(this.root, key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    return { key };
  }

  async read(key: string): Promise<Buffer> {
    return readFile(path.join(this.root, key));
  }

  async delete(key: string): Promise<void> {
    await unlink(path.join(this.root, key)).catch(() => undefined);
  }
}
