'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Plus, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ProjectForm } from './ProjectForm'
import { TouchpointList } from '@/components/touchpoints/TouchpointList'
import { TouchpointForm } from '@/components/touchpoints/TouchpointForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDateShort, projectStatusLabels, projectStatusColors } from '@/lib/utils'
import type { ProjectWithContacts } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [touchpointOpen, setTouchpointOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const { data: project, mutate, isLoading } = useSWR<ProjectWithContacts>(
    `/api/projects/${id}`,
    fetcher
  )

  if (isLoading) return <LoadingSpinner />
  if (!project) return <div className="p-8 text-center text-gray-500">Projekt nem található</div>

  const handleDelete = async () => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.push('/projects')
  }

  return (
    <div className="space-y-6">
      {/* Back + Actions */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/projects"
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex-shrink-0"
        >
          <ArrowLeft size={16} /> Vissza
        </Link>
        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" onClick={() => setTouchpointOpen(true)}>
            <Plus size={14} />
            <span className="hidden sm:inline">Kapcsolatfelvétel</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Edit size={14} />
            <span className="hidden sm:inline">Szerkesztés</span>
          </Button>
          <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
            <Trash2 size={14} />
            <span className="hidden sm:inline">Törlés</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Project Info */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 space-y-4">
            <div>
              <div className="flex items-start gap-2 mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex-1">{project.name}</h2>
                <Badge className={projectStatusColors[project.status]}>
                  {projectStatusLabels[project.status]}
                </Badge>
              </div>
              {project.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-50 dark:border-slate-700">
              <Calendar size={13} /> Létrehozva: {formatDateShort(project.createdAt)}
            </div>
          </div>

          {/* Contacts */}
          {project.contacts && project.contacts.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kontaktok</h3>
              </div>
              <div className="space-y-1">
                {project.contacts.map(({ contact }) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 group"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-700 dark:text-primary-400 text-xs font-semibold">
                        {contact.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                        {contact.name}
                      </p>
                      {contact.company && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{contact.company}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Touchpoints */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Kapcsolatfelvételi előzmények
            </h3>
            <TouchpointList projectId={id} onMutate={mutate} />
          </div>
        </div>
      </div>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Projekt szerkesztése" size="lg">
        <ProjectForm
          project={project}
          onSuccess={(updated) => {
            mutate(updated as ProjectWithContacts)
            setEditOpen(false)
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <Modal isOpen={touchpointOpen} onClose={() => setTouchpointOpen(false)} title="Kapcsolatfelvétel rögzítése">
        <TouchpointForm
          onSuccess={() => {
            mutate()
            setTouchpointOpen(false)
          }}
          onCancel={() => setTouchpointOpen(false)}
        />
      </Modal>

      <Modal isOpen={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Projekt törlése" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Biztosan törlöd a <strong>{project.name}</strong> projektet? Ez a művelet nem vonható vissza.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} className="flex-1">Törlés</Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(false)}>Mégse</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
