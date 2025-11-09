"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Home, Wand2, Archive, Crown, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

interface MobileHeaderProps {
  user: User
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Generator", href: "/generator", icon: Wand2 },
  { name: "Archive", href: "/archive", icon: Archive },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Pricing", href: "/pricing", icon: Crown },
  { name: "Upgrade", href: "/upgrade", icon: Crown },
]

export function MobileHeader({ user }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4 md:hidden">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">O</div>
        <span>Outbound.ing</span>
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-16 border-b bg-background p-4 shadow-lg">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                  {item.name === "Upgrade" && user.tier === "free" && (
                    <Badge variant="secondary" className="ml-auto">
                      Free
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="mt-4 border-t pt-4">
            <div className="mb-3 rounded-lg bg-muted p-3">
              <div className="text-xs font-medium text-muted-foreground">Account</div>
              <div className="mt-1 truncate text-sm font-medium">{user.email}</div>
              {user.tier === "pro" && (
                <Badge className="mt-2" variant="default">
                  <Crown className="mr-1 h-3 w-3" />
                  Pro Plan
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-transparent"
              onClick={() => {
                handleLogout()
                setIsOpen(false)
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
