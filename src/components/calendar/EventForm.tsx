'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { CalendarEventFull } from '@/types'

interface EventFormProps {
  event?: CalendarEventFull
  defaultDate?: Date
  onSuccess: () => void
  onCancel: () => void
  onDelete?: () => void
}

export function EventForm({ event, defaultDate, onSuccess, onCancel, onDelete }: EventFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const defaultStart = defaultDate
    ? new Date(defaultDate.setHours(10, 0, 0, 0))
    : new Date()
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000)

  const toLocal = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm")

  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startTime: event ? toLocal(new Date(event.startTime)) : toLocal(defaultStart),
    endTime: event ? toLocal(new Date(event.endTime)) : toLocal(defaultEnd),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Cím megadása kötelező'); return }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      setError('A befejezési időpontnak a kezdési időpont után kell lennie')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        event ? `/api/calendar/events/${event.id}` : '/api/calendar/events',
        {
          method: event ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            // Convert local datetime to UTC ISO before sending
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString(),
          }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Hiba történt')
      }

      onSuccess()
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
        label="Cím *"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Esemény megnevezése"
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Kezdés *"
          type="datetime-local"
          value={form.startTime}
          onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
          required
        />
        <Input
          label="Befejezés *"
          type="datetime-local"
          value={form.endTime}
          onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
          required
        />
      </div>

      <Textarea
        label="Leírás"
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="Az esemény részletei..."
        rows={3}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {event ? 'Mentés' : 'Létrehozás'}
        </Button>
        {onDelete && (
          <Button type="button" variant="danger" size="md" onClick={onDelete}>
            Törlés
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={onCancel}>
          Mégse
        </Button>
      </div>
    </form>
  )
}
