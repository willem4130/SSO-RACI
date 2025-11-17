'use client'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-indigo-900 text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          RACI <span className="text-yellow-300">Matrix</span>
        </h1>
        <p className="text-xl text-center max-w-2xl">
          World-class RACI (Responsible, Accountable, Consulted, Informed) matrix application
          with real-time collaboration, advanced analytics, and workflow automation.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20">
            <h3 className="text-2xl font-bold">Multi-Tenant →</h3>
            <div className="text-lg">
              Organization → Project → Matrix hierarchy with role-based access control
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20">
            <h3 className="text-2xl font-bold">Real-Time Collaboration →</h3>
            <div className="text-lg">
              Multiple users editing simultaneously with live updates
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20">
            <h3 className="text-2xl font-bold">Smart Validation →</h3>
            <div className="text-lg">
              Automatic RACI rules enforcement: exactly 1 Accountable, ≥1 Responsible
            </div>
          </div>
          <div className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20">
            <h3 className="text-2xl font-bold">Advanced Analytics →</h3>
            <div className="text-lg">
              Workload distribution, bottleneck analysis, and smart suggestions
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-8">
          <a
            href="/dashboard"
            className="rounded-lg bg-white px-6 py-3 text-lg font-semibold text-indigo-900 hover:bg-gray-100 transition"
          >
            Get Started
          </a>
          <a
            href="/templates"
            className="rounded-lg bg-indigo-700 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-600 transition"
          >
            Browse Templates
          </a>
        </div>
      </div>
    </main>
  )
}
