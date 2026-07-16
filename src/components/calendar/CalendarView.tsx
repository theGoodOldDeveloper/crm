'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday,
} from 'date-fns'
import { hu } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EventForm } from './EventForm'
import type { CalendarEventFull, TouchpointWithContact } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Colors for calendar event types
const calendarEventColor = 'bg-primary-500'
const touchpointColors: Record<string, string> = {
  MEETING: 'bg-orange-500',
  PHONE: 'bg-green-500',
  EMAIL: 'bg-purple-500',
  SMS: 'bg-blue-400',
}
const touchpointLabels: Record<string, string> = {
  MEETING: '🤝',
  PHONE: '📞',
  EMAIL: '📧',
  SMS: '💬',
}

interface CalendarItem {
  id: string
  title: string
  time: Date
  color: string
  isEvent: boolean
  event?: CalendarEventFull
  touchpoint?: TouchpointWithContact
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventFull | null>(null)
  const [formDefaultDate, setFormDefaultDate] = useState<Date | undefined>()
  const [syncing, setSyncing] = useState(false)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const { data: events, mutate } = useSWR<CalendarEventFull[]>(
    `/api/calendar/events?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`,
    fetcher
  )

  const { data: touchpointsData } = useSWR<TouchpointWithContact[]>(
    `/api/touchpoints?limit=200`,
    fetcher
  )

  const calendarDays = useMemo(() => {
    const days: Date[] = []
    let day = new Date(rangeStart)
    while (day <= rangeEnd) {
      days.push(new Date(day))
      day = addDays(day, 1)
    }
    return days
  }, [currentDate])

  const getItemsForDay = (day: Date): CalendarItem[] => {
    const items: CalendarItem[] = []

    // Calendar events
    ;(events || [])
      .filter((e) => isSameDay(new Date(e.startTime), day))
      .forEach((e) => {
        items.push({
          id: `ev-${e.id}`,
          title: e.title,
          time: new Date(e.startTime),
          color: calendarEventColor,
          isEvent: true,
          event: e,
        })
      })

    // Touchpoints
    ;(touchpointsData || [])
      .filter((tp) => isSameDay(new Date(tp.date), day))
      .forEach((tp) => {
        const icon = touchpointLabels[tp.type] || '📋'
        items.push({
          id: `tp-${tp.id}`,
          title: `${icon} ${tp.contact.name}`,
          time: new Date(tp.date),
          color: touchpointColors[tp.type] || 'bg-gray-400',
          isEvent: false,
          touchpoint: tp,
        })
      })

    // Sort by time
    return items.sort((a, b) => a.time.getTime() - b.time.getTime())
  }

  const openNewEvent = (day?: Date) => {
    setSelectedEvent(null)
    setFormDefaultDate(day)
    setShowForm(true)
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      await fetch('/api/calendar/sync', { method: 'POST' })
      mutate()
    } finally {
      setSyncing(false)
    }
  }

  const weekDays = ['H', 'K', 'Sze', 'Csü', 'Pén', 'Szo', 'Vas']

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white min-w-36 text-center">
            {format(currentDate, 'yyyy. MMMM', { locale: hu })}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Ma
          </button>
        </div>

        <div className="ml-auto flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSync} loading={syncing}>
            <RefreshCw size={14} /> Google szinkron
          </Button>
          <Button size="sm" onClick={() => openNewEvent()}>
            <Plus size={14} /> Új esemény
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-500 inline-block" /> Naptár esemény
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Telefonhívás
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> SMS
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Email
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Találkozó
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-slate-700">
          {weekDays.map((d) => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const items = getItemsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const today = isToday(day)

            return (
              <div
                key={i}
                onClick={() => openNewEvent(day)}
                className={`min-h-24 p-1.5 border-b border-r border-gray-50 dark:border-slate-700/50 cursor-pointer transition-colors group ${
                  !isCurrentMonth
                    ? 'bg-gray-50/50 dark:bg-slate-800/50'
                    : 'hover:bg-blue-50/30 dark:hover:bg-slate-700/20'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                    today
                      ? 'bg-primary-600 text-white'
                      : isCurrentMonth
                      ? 'text-gray-700 dark:text-gray-300 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 group-hover:text-primary-700'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {isCurrentMonth && items.length === 0 && (
                    <span className="text-gray-200 dark:text-gray-700 group-hover:text-primary-300 opacity-0 group-hover:opacity-100 transition-opacity text-sm leading-none">
                      +
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (item.isEvent && item.event) {
                          setSelectedEvent(item.event)
                          setShowForm(true)
                        }
                        // Touchpoints are read-only in calendar; navigate to contact
                      }}
                      className={`${item.color} text-white text-xs px-1.5 py-0.5 rounded truncate ${
                        item.isEvent ? 'cursor-pointer hover:opacity-80' : 'cursor-default opacity-90'
                      }`}
                      title={item.isEvent ? item.title : `${item.title}${item.touchpoint?.notes ? ' — ' + item.touchpoint.notes : ''}`}
                    >
                      {format(item.time, 'HH:mm')} {item.title}
                    </div>
                  ))}
                  {items.length > 3 && (
                    <div className="text-xs text-gray-400 pl-1">+{items.length - 3} további</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Event Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setSelectedEvent(null) }}
        title={selectedEvent ? 'Esemény szerkesztése' : 'Új esemény'}
      >
        <EventForm
          event={selectedEvent || undefined}
          defaultDate={formDefaultDate}
          onSuccess={() => {
            mutate()
            setShowForm(false)
            setSelectedEvent(null)
          }}
          onCancel={() => { setShowForm(false); setSelectedEvent(null) }}
          onDelete={selectedEvent ? async () => {
            await fetch(`/api/calendar/events/${selectedEvent.id}`, { method: 'DELETE' })
            mutate()
            setShowForm(false)
            setSelectedEvent(null)
          } : undefined}
        />
      </Modal>
    </div>
  )
}
