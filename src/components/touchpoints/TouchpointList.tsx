'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Trash2, Edit, Phone, MessageSquare, Mail, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TouchpointForm } from './TouchpointForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatDate, formatDuration, touchpointTypeLabels } from '@/lib/utils'
import type { TouchpointWithContact } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const typeIcons: Record<string, React.ElementType> = {
  PHONE: Phone,
  SMS: MessageSquare,
  EMAIL: Mail,
  MEETING: Users,
}

const typeColors: Record<string, string> = {
  PHONE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  SMS: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  EMAIL: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  MEETING: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
}

interface TouchpointListProps {
  contactId?: string
  projectId?: string
  onMutate?: () => void
}

export function TouchpointList({ contactId, projectId, onMutate }: TouchpointListProps) {
  const [editItem, setEditItem] = useState<TouchpointWithContact | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const url = contactId
    ? `/api/touchpoints?contactId=${contactId}`
    : projectId
    ? `/api/touchpoints?projectId=${projectId}`
    : '/api/touchpoints'

  const { data: touchpoints, mutate, isLoading } = useSWR<TouchpointWithContact[]>(url, fetcher)

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/touchpoints/${deleteId}`, { method: 'DELETE' })
    mutate()
    onMutate?.()
    setDeleteId(null)
  }

  if (isLoading) return <LoadingSpinner />

  if (!touchpoints?.length) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-sm">Még nincs rögzített kapcsolatfelvétel.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {touchpoints.map((tp) => {
          const Icon = typeIcons[tp.type] || Phone
          return (
            <div
              key={tp.id}
              className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30 group"
            >
              {/* Icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[tp.type]}`}>
                <Icon size={16} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {touchpointTypeLabels[tp.type]}
                  </span>
                  {!contactId && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      — {tp.contact.name}
                    </span>
                  )}
                  {tp.project && (
                    <span className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-1.5 py-0.5 rounded">
                      {tp.project.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tp.date)}</span>
                  {tp.duration && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Clock size={11} /> {formatDuration(tp.duration)}
                    </span>
                  )}
                </div>

                {tp.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{tp.notes}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => setEditItem(tp)}
                  className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => setDeleteId(tp.id)}
                  className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={!!editItem} onClose={() => setEditItem(null)} title="Kapcsolatfelvétel szerkesztése">
        {editItem && (
          <TouchpointForm
            touchpoint={editItem}
            contactId={editItem.contactId}
            onSuccess={() => {
              mutate()
              onMutate?.()
              setEditItem(null)
            }}
            onCancel={() => setEditItem(null)}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Törlés megerősítése" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Biztosan törlöd ezt a kapcsolatfelvételi bejegyzést?
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} className="flex-1">Törlés</Button>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Mégse</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
