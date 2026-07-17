import { Sidebar } from './Sidebar'
import { MobileMenuProvider } from './MobileMenuContext'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileMenuProvider>
      <div className="min-h-screen">
        <Sidebar />
        <main className="md:ml-60 min-h-screen">
          {children}
        </main>
      </div>
    </MobileMenuProvider>
  )
}
