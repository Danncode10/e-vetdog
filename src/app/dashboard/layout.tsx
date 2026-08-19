import type { Metadata } from "next";
import { getCurrentUser } from "@/services/authorization";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login");
  }

  const { user, profile } = session;

  return (
    <DashboardShell user={user} profile={profile}>
      {children}
    </DashboardShell>
  );
}
