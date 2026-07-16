import { Sidebar } from './Sidebar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        {children}
      </main>
    </div>
  )
}
