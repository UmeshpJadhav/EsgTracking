import { DashboardHeader } from "@/components/header/header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
