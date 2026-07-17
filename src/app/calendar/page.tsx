import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { CalendarView } from '@/components/calendar/CalendarView'

export default function CalendarPage() {
  return (
    <AppLayout>
      <Header title="Naptár" />
      <div className="p-4 md:p-6">
        <CalendarView />
      </div>
    </AppLayout>
  )
}
