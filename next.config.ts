import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Un package-lock.json existe plus haut dans l'arborescence utilisateur
  // (hors de ce repo) ; on fixe explicitement la racine du projet pour que
  // Turbopack ne tente pas de la détecter automatiquement.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
