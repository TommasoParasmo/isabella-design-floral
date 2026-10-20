"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="hover:text-cream"
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace("/entrar");
        router.refresh();
      }}
    >
      Sair
    </button>
  );
}
