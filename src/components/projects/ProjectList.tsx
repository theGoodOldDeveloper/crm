'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Plus, ChevronRight, Users, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ProjectForm } from './ProjectForm'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { projectStatusLabels, projectStatusColors } from '@/lib/utils'
import type { ProjectWithContacts } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const statusFilters = [
  { value: '', label: 'Összes' },
  { value: 'ACTIVE', label: 'Aktív' },
  { value: 'ON_HOLD', label: 'Függőben' },
  { value: 'COMPLETED', label: 'Befejezett' },
]

export function ProjectList() {
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)

  const { data: projects, mutate, isLoading } = useSWR<ProjectWithContacts[]>(
    `/api/projects${statusFilter ? `?status=${statusFilter}` : ''}`,
    fetcher
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowForm(true)}>
            <Plus size={16} /> Új projekt
          </Button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSpinner />
      ) : projects?.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📁</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Nincs projekt</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {statusFilter ? 'Nincs projekt ebben a státuszban.' : 'Hozd létre az első projektet!'}
          </p>
          {!statusFilter && (
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} /> Első projekt
            </Button>
          )}
        </div>
      ) : (
        <div className="card divide-y divide-gray-50 dark:divide-slate-700/50">
          {projects?.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {project.name}
                  </span>
                  <Badge className={projectStatusColors[project.status]}>
                    {projectStatusLabels[project.status]}
                  </Badge>
                </div>
                {project.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  {project._count && project._count.contacts > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Users size={11} /> {project._count.contacts} kontakt
                    </span>
                  )}
                  {project._count && project._count.touchpoints > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <MessageSquare size={11} /> {project._count.touchpoints} esemény
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Új projekt" size="lg">
        <ProjectForm
          onSuccess={() => {
            mutate()
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}
