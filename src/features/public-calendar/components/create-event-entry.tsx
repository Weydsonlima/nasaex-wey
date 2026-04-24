"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function CreateEventEntry() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) return null;

  const handleClick = () => {
    if (session?.user) {
      router.push("/home?create=event-public");
      return;
    }
    router.push("/sign-in?callbackUrl=/calendario");
  };

  return (
    <Button onClick={handleClick} size="lg" className="gap-2">
      <Plus className="h-4 w-4" />
      Criar Evento
    </Button>
  );
}
