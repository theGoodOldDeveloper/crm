'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { ProjectWithContacts, ContactWithProjects } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const statusOptions = [
  { value: 'ACTIVE', label: '🟢 Aktív' },
  { value: 'ON_HOLD', label: '🟡 Függőben' },
  { value: 'COMPLETED', label: '🔵 Befejezett' },
]

interface ProjectFormProps {
  project?: ProjectWithContacts
  onSuccess: (project: ProjectWithContacts) => void
  onCancel: () => void
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: project?.name || '',
    status: project?.status || 'ACTIVE',
    description: project?.description || '',
  })
  const [selectedContacts, setSelectedContacts] = useState<string[]>(
    project?.contacts.map((c) => c.contact.id) || []
  )

  const { data: contactsData } = useSWR<{ contacts: ContactWithProjects[] }>(
    '/api/contacts?limit=200',
    fetcher
  )

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Projekt neve kötelező'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        project ? `/api/projects/${project.id}` : '/api/projects',
        {
          method: project ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, contactIds: selectedContacts }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Hiba történt')
      }

      onSuccess(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba történt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <Input
        label="Projekt neve *"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="pl. Weboldal fejlesztés"
        required
      />

      <Select
        label="Státusz"
        options={statusOptions}
        value={form.status}
        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
      />

      <Textarea
        label="Leírás"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="A projekt leírása, célkitűzések..."
        rows={3}
      />

      {/* Contacts */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Kapcsolódó kontaktok
        </label>
        {contactsData?.contacts.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Nincs elérhető kontakt.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-lg divide-y divide-gray-50 dark:divide-slate-700">
            {contactsData?.contacts.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/30"
              >
                <input
                  type="checkbox"
                  checked={selectedContacts.includes(c.id)}
                  onChange={() => toggleContact(c.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {c.name}
                  {c.company && (
                    <span className="text-gray-400 dark:text-gray-500"> — {c.company}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {project ? 'Mentés' : 'Létrehozás'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Mégse
        </Button>
      </div>
    </form>
  )
}
