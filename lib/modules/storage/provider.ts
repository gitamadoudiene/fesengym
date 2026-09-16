export type StoredFile = {
  key: string;
};

export interface StorageProvider {
  save(params: {
    key: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<StoredFile>;
  /**
   * Relit le contenu d'un fichier précédemment sauvegardé, pour le relayer
   * via une route authentifiée — voir lib/modules/documents/service.ts et
   * DECISIONS.md (aucune URL de stockage n'est jamais exposée au client).
   */
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
