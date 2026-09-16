import "server-only";
import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local";
import { VercelBlobStorageProvider } from "./vercel-blob";

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;

  const driver = process.env.STORAGE_DRIVER || "local";
  instance =
    driver === "vercel-blob" ? new VercelBlobStorageProvider() : new LocalStorageProvider();

  return instance;
}

export type { StorageProvider, StoredFile } from "./provider";
