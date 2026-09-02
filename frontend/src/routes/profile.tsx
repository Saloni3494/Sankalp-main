import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/mplads/PageHeader";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "User Profile — MPLADS AI Monitor" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="User Profile"
        subtitle="Manage your profile information and access settings."
      />
      <div className="card-surface p-8 text-center text-muted-foreground">
        Profile details and account management will appear here.
      </div>
    </div>
  );
}
