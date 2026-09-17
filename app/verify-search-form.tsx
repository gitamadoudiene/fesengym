"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function VerifySearchForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/verify-license/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 flex w-full max-w-md items-center rounded-lg border border-border bg-card p-1.5 shadow-sm"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ex. FSG-2027-000128"
        className="flex-1 truncate bg-transparent px-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <Button size="sm" type="submit">
        Vérifier
      </Button>
    </form>
  );
}
