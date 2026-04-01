import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { NotificationPreferencesPanel } from "@/features/settings/components/notification-preferences-panel";

export default async function NotificationsSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/sign-in");

  const orgId = session.session.activeOrganizationId;
  if (!orgId) redirect("/settings");

  return (
    <div className="px-4 pb-8 max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Notificações</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure quais eventos geram alertas e como você quer recebê-los.
        </p>
      </div>
      <NotificationPreferencesPanel organizationId={orgId} />
    </div>
  );
}
