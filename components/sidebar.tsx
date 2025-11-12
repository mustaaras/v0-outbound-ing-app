"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Wand2, Archive, Crown, LogOut, Settings, Users, Coins, Rocket, Shield } from "lucide-react"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

interface SidebarProps {
  user: User
}

const getNavigation = (userEmail: string) => {
  const baseNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Search Contacts", href: "/search-buyers", icon: Users, badge: "beta" },
    { name: "Email Generator", href: "/generator", icon: Wand2 },
    { name: "Archive", href: "/archive", icon: Archive },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Upgrade", href: "/upgrade", icon: Rocket },
    { name: "Pricing", href: "/pricing", icon: Coins },
  ]
  
  // Add admin link only for admin user
  if (userEmail === "mustafaaras91@gmail.com") {
    baseNavigation.splice(5, 0, { name: "Admin", href: "/admin", icon: Shield })
  }
  
  return baseNavigation
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navigation = getNavigation(user.email)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="hidden w-64 flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            O
          </div>
          <span className="text-lg">Outbound.ing</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
              {item.badge && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                  {item.badge}
                </Badge>
              )}
              {item.name === "Upgrade" && user.tier === "free" && (
                <Badge variant="secondary" className="ml-auto">
                  Free
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <div className="mb-4 rounded-lg bg-muted p-3">
          <div className="text-xs font-medium text-muted-foreground">Account</div>
          <div className="mt-1 truncate text-sm font-medium">{user.email}</div>
          <Badge className="mt-2" variant={user.tier === "pro" ? "default" : user.tier === "light" ? "secondary" : "outline"}>
            {user.tier === "pro" && <Crown className="mr-1 h-3 w-3" />}
            {user.tier === "light" && <Rocket className="mr-1 h-3 w-3" />}
            {user.tier === "free" && <Coins className="mr-1 h-3 w-3" />}
            {user.tier === "pro" ? "Pro Plan" : user.tier === "light" ? "Light Plan" : "Free Plan"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}
