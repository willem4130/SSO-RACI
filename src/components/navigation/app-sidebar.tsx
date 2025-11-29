'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Grid3X3,
  FileText,
  BarChart3,
  Settings,
  ChevronRight,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Organizations',
    href: '/organizations',
    icon: Building2,
  },
  {
    title: 'Templates',
    href: '/templates',
    icon: FileText,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
]

const bottomNavItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background flex flex-col',
        className
      )}
    >
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Grid3X3 className="h-4 w-4" />
          </div>
          <span className="text-lg">RACI Matrix</span>
        </Link>
      </div>

      {/* Quick Action */}
      <div className="p-4">
        <Button className="w-full justify-start gap-2" size="sm">
          <Plus className="h-4 w-4" />
          New Matrix
        </Button>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 px-4">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    active && 'bg-accent font-medium'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                  {item.href === '/organizations' && (
                    <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t p-4">
        <nav className="space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    active && 'bg-accent font-medium'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
