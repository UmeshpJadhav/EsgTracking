import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { HomeHeader } from "@/components/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <HomeHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}