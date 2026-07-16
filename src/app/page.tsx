import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default function DashboardPage() {
  return (
    <AppLayout>
      <Header title="Dashboard" />
      <div className="p-6">
        <DashboardContent />
      </div>
    </AppLayout>
  )
}
