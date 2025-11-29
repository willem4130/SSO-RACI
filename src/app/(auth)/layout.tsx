import { AppSidebar, AppHeader } from '@/components/navigation'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 pl-64">
        {/* Header with breadcrumbs and user menu */}
        <AppHeader />

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
