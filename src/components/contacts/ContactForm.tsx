'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import type { ContactWithProjects } from '@/types'

interface ContactFormProps {
  contact?: ContactWithProjects
  onSuccess: (contact: ContactWithProjects) => void
  onCancel: () => void
}

export function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: contact?.name || '',
    company: contact?.company || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    address: contact?.address || '',
    notes: contact?.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Név megadása kötelező')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        contact ? `/api/contacts/${contact.id}` : '/api/contacts',
        {
          method: contact ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Hiba történt')
      }

      const data = await res.json()
      onSuccess(data)
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
        label="Név *"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        placeholder="Kovács János"
        required
      />
      <Input
        label="Cégnév"
        value={form.company}
        onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
        placeholder="Példa Kft."
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        placeholder="kovacs@pelda.hu"
      />
      <Input
        label="Telefonszám"
        type="tel"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        placeholder="+36 30 123 4567"
      />
      <Input
        label="Cím"
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        placeholder="1051 Budapest, Vörösmarty tér 1."
      />
      <Textarea
        label="Megjegyzés"
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Megjegyzések a kapcsolatról..."
        rows={4}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {contact ? 'Mentés' : 'Létrehozás'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Mégse
        </Button>
      </div>
    </form>
  )
}
