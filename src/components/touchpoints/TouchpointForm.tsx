'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import type { TouchpointWithContact, ContactWithProjects, ProjectWithContacts } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const typeOptions = [
  { value: 'PHONE', label: '📞 Telefonhívás' },
  { value: 'SMS', label: '💬 SMS' },
  { value: 'EMAIL', label: '📧 Email' },
  { value: 'MEETING', label: '🤝 Személyes találkozó' },
]

interface TouchpointFormProps {
  contactId?: string
  touchpoint?: TouchpointWithContact
  onSuccess: (tp: TouchpointWithContact) => void
  onCancel: () => void
}

export function TouchpointForm({ contactId, touchpoint, onSuccess, onCancel }: TouchpointFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  now.setSeconds(0, 0)
  const defaultDate = now.toISOString().slice(0, 16)

  const [form, setForm] = useState({
    contactId: touchpoint?.contactId || contactId || '',
    projectId: touchpoint?.projectId || '',
    type: touchpoint?.type || 'PHONE',
    date: touchpoint ? new Date(touchpoint.date).toISOString().slice(0, 16) : defaultDate,
    duration: touchpoint?.duration?.toString() || '',
    notes: touchpoint?.notes || '',
  })

  const { data: contactsData } = useSWR<{ contacts: ContactWithProjects[] }>(
    !contactId ? '/api/contacts?limit=100' : null,
    fetcher
  )

  const { data: projects } = useSWR<ProjectWithContacts[]>('/api/projects', fetcher)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contactId) { setError('Kontakt megadása kötelező'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        touchpoint ? `/api/touchpoints/${touchpoint.id}` : '/api/touchpoints',
        {
          method: touchpoint ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            // Convert local datetime to UTC ISO before sending to server
            date: new Date(form.date).toISOString(),
            duration: form.duration ? parseInt(form.duration) : null,
          }),
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

      {!contactId && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kontakt *</label>
          <select
            className="input-field"
            value={form.contactId}
            onChange={(e) => setForm((f) => ({ ...f, contactId: e.target.value }))}
            required
          >
            <option value="">Válassz kontaktot...</option>
            {contactsData?.contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
            ))}
          </select>
        </div>
      )}

      <Select
        label="Típus *"
        options={typeOptions}
        value={form.type}
        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
        required
      />

      <Input
        label="Dátum és idő *"
        type="datetime-local"
        value={form.date}
        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
        required
      />

      <Input
        label="Időtartam (perc)"
        type="number"
        min="0"
        max="999"
        value={form.duration}
        onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
        placeholder="pl. 30"
      />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Projekt (opcionális)</label>
        <select
          className="input-field"
          value={form.projectId}
          onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
        >
          <option value="">Nincs projekt</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <Textarea
        label="Megjegyzés"
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Mit tárgyaltatok, mi volt az eredmény..."
        rows={4}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {touchpoint ? 'Mentés' : 'Rögzítés'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Mégse
        </Button>
      </div>
    </form>
  )
}
