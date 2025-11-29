'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Search, Settings, LogOut, User, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

// Generate breadcrumbs from pathname
function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href: string }[] = []

  // Map of path segments to display labels
  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    organizations: 'Organizations',
    projects: 'Projects',
    matrices: 'Matrices',
    templates: 'Templates',
    analytics: 'Analytics',
    settings: 'Settings',
  }

  let currentPath = ''
  for (const segment of segments) {
    currentPath += `/${segment}`

    // Check if it's a known segment or a dynamic ID
    if (labelMap[segment]) {
      breadcrumbs.push({
        label: labelMap[segment],
        href: currentPath,
      })
    } else if (segment.match(/^[a-z0-9-]+$/i)) {
      // Dynamic ID - could be org ID, project ID, etc.
      // In a real app, you'd fetch the name from context or API
      breadcrumbs.push({
        label: segment.length > 8 ? `${segment.substring(0, 8)}...` : segment,
        href: currentPath,
      })
    }
  }

  return breadcrumbs
}

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <header className={`sticky top-0 z-30 flex h-16 items-center border-b bg-background px-6 ${className}`}>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9"
          />
        </div>
      </div>

      <Separator orientation="vertical" className="mx-4 h-6 hidden md:block" />

      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
          3
        </span>
      </Button>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="ml-2 gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="User" />
              <AvatarFallback>DU</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start text-sm">
              <span className="font-medium">Dev User</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span>Dev User</span>
              <span className="text-xs font-normal text-muted-foreground">
                dev@raci.local
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
