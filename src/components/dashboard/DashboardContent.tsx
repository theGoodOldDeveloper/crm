'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Users, FolderKanban, MessageSquare, Calendar, Phone, Mail, MessageCircle, UserCheck } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatRelative, touchpointTypeLabels, projectStatusLabels, projectStatusColors } from '@/lib/utils'
import type { DashboardStats } from '@/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const typeIcons: Record<string, React.ElementType> = {
  PHONE: Phone,
  SMS: MessageCircle,
  EMAIL: Mail,
  MEETING: UserCheck,
}

const typeColors: Record<string, string> = {
  PHONE: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  SMS: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  EMAIL: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  MEETING: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
}

export function DashboardContent() {
  const { data, isLoading } = useSWR<DashboardStats>('/api/dashboard', fetcher)

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/contacts" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {data?.totalContacts || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Összes kontakt</div>
        </Link>

        <Link href="/projects?status=ACTIVE" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <FolderKanban size={20} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {data?.activeProjects || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Aktív projekt</div>
        </Link>

        <Link href="/touchpoints" className="card p-5 hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {data?.touchpointsThisMonth || 0}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Kapcsolatfelvétel (hónap)</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar size={15} /> Közelgő események
            </h2>
            <Link href="/calendar" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
              Naptár →
            </Link>
          </div>

          {!data?.upcomingEvents?.length ? (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500">
              <Calendar size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nincs közelgő esemény a következő 7 napban.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.upcomingEvents.map((event) => (
                <div key={event.id} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30">
                  <div className="text-center flex-shrink-0 w-10">
                    <div className="text-lg font-bold text-primary-600 dark:text-primary-400 leading-none">
                      {new Date(event.startTime).getDate()}
                    </div>
                    <div className="text-xs text-gray-400 uppercase">
                      {new Date(event.startTime).toLocaleString('hu', { month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{event.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(event.startTime).toLocaleTimeString('hu', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(event.endTime).toLocaleTimeString('hu', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Touchpoints */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <MessageSquare size={15} /> Legutóbbi kapcsolatfelvételek
            </h2>
            <Link href="/touchpoints" className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
              Összes →
            </Link>
          </div>

          {!data?.recentTouchpoints?.length ? (
            <div className="text-center py-6 text-gray-400 dark:text-gray-500">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">Még nincs rögzített kapcsolatfelvétel.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentTouchpoints.map((tp) => {
                const Icon = typeIcons[tp.type] || Phone
                return (
                  <Link
                    key={tp.id}
                    href={`/contacts/${tp.contactId}`}
                    className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30 group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[tp.type] || ''}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 truncate">
                          {tp.contact.name}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          • {touchpointTypeLabels[tp.type]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatRelative(tp.date)}</p>
                      {tp.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{tp.notes}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
