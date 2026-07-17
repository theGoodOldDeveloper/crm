'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import useSWR from 'swr'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, subDays, isSameMonth, isSameDay, isToday,
} from 'date-fns'
import { hu } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, RefreshCw, CalendarDays, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EventForm } from './EventForm'
import type { CalendarEventFull, TouchpointWithContact } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Colors
const calendarEventColor = 'bg-primary-500'
const calendarEventBorder = 'border-primary-600'
const touchpointColors: Record<string, string> = {
  MEETING: 'bg-orange-500',
  PHONE: 'bg-green-500',
  EMAIL: 'bg-purple-500',
  SMS: 'bg-blue-400',
}
const touchpointBorders: Record<string, string> = {
  MEETING: 'border-orange-600',
  PHONE: 'border-green-600',
  EMAIL: 'border-purple-600',
  SMS: 'border-blue-500',
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
  endTime?: Date
  color: string
  borderColor: string
  isEvent: boolean
  event?: CalendarEventFull
  touchpoint?: TouchpointWithContact
}

// Day view constants
const HOUR_HEIGHT = 64 // px per hour
const DAY_HOURS = Array.from({ length: 24 }, (_, i) => i) // 0..23

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
  const [dayViewDate, setDayViewDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventFull | null>(null)
  const [formDefaultDate, setFormDefaultDate] = useState<Date | undefined>()
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const dayViewScrollRef = useRef<HTMLDivElement>(null)

  // Scroll to 7:00 on day view open
  useEffect(() => {
    if (viewMode === 'day' && dayViewScrollRef.current) {
      dayViewScrollRef.current.scrollTop = 7 * HOUR_HEIGHT - 16
    }
  }, [viewMode, dayViewDate])

  // Month view range
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // For day view: fetch a wider range (whole month) so switching days doesn't re-fetch
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

    ;(events || [])
      .filter((e) => isSameDay(new Date(e.startTime), day))
      .forEach((e) => {
        items.push({
          id: `ev-${e.id}`,
          title: e.title,
          time: new Date(e.startTime),
          endTime: new Date(e.endTime),
          color: calendarEventColor,
          borderColor: calendarEventBorder,
          isEvent: true,
          event: e,
        })
      })

    ;(touchpointsData || [])
      .filter((tp) => isSameDay(new Date(tp.date), day))
      .forEach((tp) => {
        const icon = touchpointLabels[tp.type] || '📋'
        const startTime = new Date(tp.date)
        const endTime = tp.duration
          ? new Date(startTime.getTime() + tp.duration * 60 * 1000)
          : new Date(startTime.getTime() + 30 * 60 * 1000)
        items.push({
          id: `tp-${tp.id}`,
          title: `${icon} ${tp.contact.name}`,
          time: startTime,
          endTime,
          color: touchpointColors[tp.type] || 'bg-gray-400',
          borderColor: touchpointBorders[tp.type] || 'border-gray-500',
          isEvent: false,
          touchpoint: tp,
        })
      })

    return items.sort((a, b) => a.time.getTime() - b.time.getTime())
  }

  const openNewEvent = (defaultDate?: Date) => {
    setSelectedEvent(null)
    setFormDefaultDate(defaultDate)
    setShowForm(true)
  }

  const openDayView = (day: Date) => {
    setDayViewDate(day)
    setViewMode('day')
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      const res = await fetch('/api/calendar/sync', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSyncError(data.error || 'Szinkronizáció sikertelen')
      } else {
        mutate()
      }
    } catch {
      setSyncError('Hálózati hiba')
    } finally {
      setSyncing(false)
    }
  }

  // Day view: position event block
  const getEventStyle = (item: CalendarItem) => {
    const startMinutes = item.time.getHours() * 60 + item.time.getMinutes()
    const endTime = item.endTime || new Date(item.time.getTime() + 30 * 60 * 1000)
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes()
    const durationMinutes = Math.max(endMinutes - startMinutes, 15)
    return {
      top: (startMinutes / 60) * HOUR_HEIGHT,
      height: Math.max((durationMinutes / 60) * HOUR_HEIGHT, 22),
    }
  }

  const weekDays = ['H', 'K', 'Sze', 'Csü', 'Pén', 'Szo', 'Vas']

  const dayViewItems = getItemsForDay(dayViewDate)

  // Current time indicator position
  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowTop = (nowMinutes / 60) * HOUR_HEIGHT

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {viewMode === 'month' ? (
            <>
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
            </>
          ) : (
            <>
              <button
                onClick={() => setDayViewDate(subDays(dayViewDate, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white text-center min-w-48">
                {format(dayViewDate, 'yyyy. MMMM d., EEEE', { locale: hu })}
              </h2>
              <button
                onClick={() => setDayViewDate(addDays(dayViewDate, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={() => setDayViewDate(new Date())}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
              >
                Ma
              </button>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 transition-colors ${
                viewMode === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
              title="Havi nézet"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => { setDayViewDate(new Date()); setViewMode('day') }}
              className={`p-1.5 transition-colors ${
                viewMode === 'day'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
              title="Napi nézet"
            >
              <CalendarDays size={15} />
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={handleSync} loading={syncing}>
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Google szinkron</span>
          </Button>
          <Button size="sm" onClick={() => openNewEvent(viewMode === 'day' ? dayViewDate : undefined)}>
            <Plus size={14} />
            <span className="hidden sm:inline">Új esemény</span>
          </Button>
        </div>
      </div>

      {/* Sync error */}
      {syncError && (
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          <span className="flex-1">{syncError}</span>
          <button onClick={() => setSyncError(null)} className="text-amber-500 hover:text-amber-700 text-xs">✕</button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
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

      {/* ── MONTH VIEW ── */}
      {viewMode === 'month' && (
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
                  onClick={() => openDayView(day)}
                  className={`min-h-14 md:min-h-24 p-1 md:p-1.5 border-b border-r border-gray-50 dark:border-slate-700/50 cursor-pointer transition-colors group ${
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

                  {/* Mobile: colored dots */}
                  {items.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 md:hidden">
                      {items.slice(0, 4).map((item) => (
                        <span
                          key={item.id}
                          className={`w-1.5 h-1.5 rounded-full inline-block ${item.color}`}
                          title={item.title}
                        />
                      ))}
                      {items.length > 4 && (
                        <span className="text-gray-400 text-xs leading-none">+</span>
                      )}
                    </div>
                  )}

                  {/* Desktop: text pills */}
                  <div className="hidden md:block space-y-0.5">
                    {items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (item.isEvent && item.event) {
                            setSelectedEvent(item.event)
                            setShowForm(true)
                          }
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
      )}

      {/* ── DAY VIEW ── */}
      {viewMode === 'day' && (
        <div className="card overflow-hidden">
          {/* Scrollable timeline */}
          <div
            ref={dayViewScrollRef}
            className="overflow-y-auto"
            style={{ maxHeight: '70vh' }}
          >
            <div className="relative" style={{ height: DAY_HOURS.length * HOUR_HEIGHT }}>
              {/* Hour grid lines + labels */}
              {DAY_HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-gray-100 dark:border-slate-700/60 flex"
                  style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                >
                  <div className="w-14 flex-shrink-0 pr-3 text-right">
                    <span className="text-xs text-gray-400 dark:text-gray-500 -translate-y-2 inline-block">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                  {/* Half-hour line */}
                  <div
                    className="absolute left-14 right-0 border-t border-gray-50 dark:border-slate-700/30"
                    style={{ top: HOUR_HEIGHT / 2 }}
                  />
                </div>
              ))}

              {/* Current time indicator */}
              {isToday(dayViewDate) && (
                <div
                  className="absolute left-14 right-0 z-10 pointer-events-none"
                  style={{ top: nowTop }}
                >
                  <div className="relative">
                    <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
                    <div className="border-t-2 border-red-500 w-full" />
                  </div>
                </div>
              )}

              {/* Events */}
              <div className="absolute left-14 right-2 top-0 bottom-0">
                {dayViewItems.map((item) => {
                  const { top, height } = getEventStyle(item)
                  return (
                    <div
                      key={item.id}
                      className={`absolute left-0 right-0 ${item.color} border-l-2 ${item.borderColor} text-white rounded-r-lg px-2 py-0.5 overflow-hidden ${
                        item.isEvent ? 'cursor-pointer hover:opacity-90' : 'cursor-default opacity-90'
                      }`}
                      style={{ top: top + 1, height: height - 2, minHeight: 22 }}
                      onClick={() => {
                        if (item.isEvent && item.event) {
                          setSelectedEvent(item.event)
                          setShowForm(true)
                        }
                      }}
                      title={item.touchpoint?.notes ? `${item.title} — ${item.touchpoint.notes}` : item.title}
                    >
                      <div className="text-xs font-medium leading-tight truncate">
                        {format(item.time, 'HH:mm')}
                        {item.endTime && ` – ${format(item.endTime, 'HH:mm')}`}
                      </div>
                      {height >= 36 && (
                        <div className="text-xs opacity-90 truncate leading-tight">{item.title}</div>
                      )}
                    </div>
                  )
                })}

                {/* Empty state */}
                {dayViewItems.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400 dark:text-gray-500 py-8">
                      <p className="text-sm">Nincs esemény ezen a napon</p>
                      <button
                        onClick={() => openNewEvent(dayViewDate)}
                        className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        + Új esemény létrehozása
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
