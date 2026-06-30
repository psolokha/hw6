import { AppShell } from "@/components/app-shell"

export default function PlannerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>
}
