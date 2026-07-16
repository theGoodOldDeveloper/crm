'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Header } from '@/components/layout/Header'
import { TouchpointList } from '@/components/touchpoints/TouchpointList'
import { TouchpointForm } from '@/components/touchpoints/TouchpointForm'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Plus } from 'lucide-react'

function TouchpointsContent() {
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> Kapcsolatfelvétel rögzítése
        </Button>
      </div>

      <div className="card p-5">
        <TouchpointList key={refreshKey} />
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Kapcsolatfelvétel rögzítése">
        <TouchpointForm
          onSuccess={() => {
            setShowForm(false)
            setRefreshKey((k) => k + 1)
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>
    </div>
  )
}

export default function TouchpointsPage() {
  return (
    <AppLayout>
      <Header title="Kapcsolatfelvételi napló" />
      <div className="p-6">
        <TouchpointsContent />
      </div>
    </AppLayout>
  )
}
