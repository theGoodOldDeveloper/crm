'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2, Mail, Phone, MapPin, Edit, Trash2,
  Plus, ArrowLeft, Calendar, FolderKanban,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { ContactForm } from './ContactForm'
import { TouchpointForm } from '@/components/touchpoints/TouchpointForm'
import { TouchpointList } from '@/components/touchpoints/TouchpointList'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort, projectStatusLabels, projectStatusColors } from '@/lib/utils'
import type { ContactWithProjects } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ContactDetail({ id }: { id: string }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [touchpointOpen, setTouchpointOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: contact, mutate, isLoading } = useSWR<ContactWithProjects>(
    `/api/contacts/${id}`,
    fetcher
  )

  if (isLoading) return <LoadingSpinner />
  if (!contact) return <div className="p-8 text-center text-gray-500">Kontakt nem található</div>

  const handleDelete = async () => {
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    router.push('/contacts')
  }

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/contacts"
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <ArrowLeft size={16} /> Vissza
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setTouchpointOpen(true)}>
            <Plus size={14} /> Kapcsolatfelvétel
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Edit size={14} /> Szerkesztés
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
            <Trash2 size={14} /> Törlés
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Contact Card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-700 dark:text-primary-400 text-xl font-bold">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{contact.name}</h2>
                {contact.company && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{contact.company}</p>
                )}
              </div>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-gray-50 dark:border-slate-700">
              {contact.email && (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <Mail size={15} className="flex-shrink-0 text-gray-400" /> {contact.email}
                </a>
              )}
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <Phone size={15} className="flex-shrink-0 text-gray-400" /> {contact.phone}
                </a>
              )}
              {contact.address && (
                <div className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={15} className="flex-shrink-0 text-gray-400 mt-0.5" /> {contact.address}
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-gray-400 dark:text-gray-500">
                <Calendar size={15} className="flex-shrink-0" /> Hozzáadva: {formatDateShort(contact.createdAt)}
              </div>
            </div>

            {contact.notes && (
              <div className="pt-3 border-t border-gray-50 dark:border-slate-700">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Megjegyzés</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </div>

          {/* Projects */}
          {contact.projects && contact.projects.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderKanban size={15} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Projektek</h3>
              </div>
              <div className="space-y-2">
                {contact.projects.map(({ project }) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 group"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                      {project.name}
                    </span>
                    <Badge className={projectStatusColors[project.status]}>
                      {projectStatusLabels[project.status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Touchpoints timeline */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Kapcsolatfelvételi előzmények
            </h3>
            <TouchpointList contactId={id} onMutate={mutate} />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Kontakt szerkesztése">
        <ContactForm
          contact={contact}
          onSuccess={(updated) => {
            mutate(updated as ContactWithProjects)
            setEditOpen(false)
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* Touchpoint Modal */}
      <Modal isOpen={touchpointOpen} onClose={() => setTouchpointOpen(false)} title="Kapcsolatfelvétel rögzítése">
        <TouchpointForm
          contactId={id}
          onSuccess={() => {
            mutate()
            setTouchpointOpen(false)
          }}
          onCancel={() => setTouchpointOpen(false)}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Kontakt törlése" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Biztosan törlöd <strong>{contact.name}</strong> kontaktot? Ez a művelet nem vonható vissza.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} className="flex-1">
              Törlés
            </Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>
              Mégse
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
