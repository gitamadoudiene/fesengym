import { NextResponse } from "next/server";
import { getStorageProvider } from "@/lib/modules/storage";

/**
 * Route de diagnostic TEMPORAIRE pour déboguer l'échec d'upload Vercel Blob
 * en production. Ne révèle aucune valeur de secret. À SUPPRIMER une fois le
 * problème résolu.
 */
export async function GET() {
  const diag: Record<string, unknown> = {
    storageDriver: process.env.STORAGE_DRIVER ?? null,
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    blobTokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length ?? 0,
  };

  try {
    const storage = getStorageProvider();
    diag.providerClass = storage.constructor.name;

    const testBuffer = Buffer.from("diagnostic-test");
    const stored = await storage.save({
      key: `diagnostics/test-${Date.now()}.txt`,
      buffer: testBuffer,
      mimeType: "text/plain",
    });
    diag.saveOk = true;
    diag.storedKey = stored.key;

    const readBack = await storage.read(stored.key);
    diag.readOk = readBack.toString() === "diagnostic-test";

    await storage.delete(stored.key);
    diag.deleteOk = true;
  } catch (error) {
    diag.error = error instanceof Error ? error.message : String(error);
    diag.errorStack = error instanceof Error ? error.stack : null;
  }

  return NextResponse.json(diag);
}
