import type React from "react"
import { getCurrentUser } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileHeader } from "@/components/mobile-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col">
        <MobileHeader user={user} />
        <main className="flex-1 overflow-y-auto bg-muted/10 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
