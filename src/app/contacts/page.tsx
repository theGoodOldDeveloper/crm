import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { ContactList } from '@/components/contacts/ContactList'

interface Props {
  searchParams: { search?: string }
}

export default function ContactsPage({ searchParams }: Props) {
  return (
    <AppLayout>
      <Header title="Kapcsolatok" />
      <div className="p-6">
        <ContactList initialSearch={searchParams.search || ''} />
      </div>
    </AppLayout>
  )
}
