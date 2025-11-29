import { redirect } from 'next/navigation'

export default function Home() {
  // Direct entry - no marketing fluff
  // In dev mode, middleware bypasses auth, so this goes straight to dashboard
  // In production, middleware will redirect to login if not authenticated
  redirect('/dashboard')
}
