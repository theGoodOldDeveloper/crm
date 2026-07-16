'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Plus, Search, Building2, Mail, Phone, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { ContactForm } from './ContactForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { ContactWithProjects } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ContactListProps {
  initialSearch?: string
}

export function ContactList({ initialSearch = '' }: ContactListProps) {
  const [search, setSearch] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [showForm, setShowForm] = useState(false)

  const { data, mutate, isLoading } = useSWR<{ contacts: ContactWithProjects[]; total: number }>(
    `/api/contacts?search=${encodeURIComponent(debouncedSearch)}`,
    fetcher
  )

  const handleSearchChange = (value: string) => {
    setSearch(value)
    clearTimeout((window as any).__searchTimeout)
    ;(window as any).__searchTimeout = setTimeout(() => setDebouncedSearch(value), 300)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Keresés név, cég, email alapján..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> Új kontakt
        </Button>
      </div>

      {/* Results count */}
      {data && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {data.total} kontakt {debouncedSearch && `"${debouncedSearch}" keresésre`}
        </p>
      )}

      {/* List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : data?.contacts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">👤</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Nincs kontakt</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {debouncedSearch ? 'Nincs találat erre a keresésre.' : 'Adj hozzá az első kontaktot!'}
          </p>
          {!debouncedSearch && (
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} /> Első kontakt hozzáadása
            </Button>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-gray-50 dark:divide-slate-700/50">
          {data?.contacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 dark:text-primary-400 font-semibold text-sm">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {contact.name}
                  </span>
                  {contact._count && contact._count.touchpoints > 0 && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {contact._count.touchpoints} kapcsolatfelvétel
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {contact.company && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                      <Building2 size={11} /> {contact.company}
                    </span>
                  )}
                  {contact.email && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                      <Mail size={11} /> {contact.email}
                    </span>
                  )}
                  {contact.phone && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      <Phone size={11} /> {contact.phone}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {/* New Contact Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Új kontakt">
        <ContactForm
          onSuccess={(contact) => {
            mutate()
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
