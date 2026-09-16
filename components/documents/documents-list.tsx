import { FileText } from "lucide-react";
import type { Document } from "@prisma/client";

const TYPE_LABELS: Record<Document["type"], string> = {
  PHOTO: "Photo",
  MEDICAL_CERTIFICATE: "Certificat médical",
  PROOF_OF_IDENTITY: "Justificatif d'identité",
  PAYMENT_PROOF: "Justificatif de paiement",
  ADMINISTRATIVE: "Document administratif",
  OTHER: "Autre",
};

export function DocumentsList({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">Aucun document.</p>;
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li key={doc.id}>
          <a
            href={`/api/documents/${doc.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-border p-2 text-sm hover:bg-accent/40"
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-foreground">{doc.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {TYPE_LABELS[doc.type]}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
