import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { ContactDetail } from '@/components/contacts/ContactDetail'

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <Header title="Kontakt részletek" />
      <div className="p-6">
        <ContactDetail id={params.id} />
      </div>
    </AppLayout>
  )
}
