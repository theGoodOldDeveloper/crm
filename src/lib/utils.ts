import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { hu } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return `Ma ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `Tegnap ${format(d, 'HH:mm')}`
  return format(d, 'yyyy. MM. dd. HH:mm', { locale: hu })
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), 'yyyy. MM. dd.', { locale: hu })
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: hu })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} perc`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours} óra`
  return `${hours} óra ${mins} perc`
}

export const touchpointTypeLabels: Record<string, string> = {
  PHONE: 'Telefonhívás',
  SMS: 'SMS',
  EMAIL: 'Email',
  MEETING: 'Személyes találkozó',
}

export const touchpointTypeIcons: Record<string, string> = {
  PHONE: '📞',
  SMS: '💬',
  EMAIL: '📧',
  MEETING: '🤝',
}

export const projectStatusLabels: Record<string, string> = {
  ACTIVE: 'Aktív',
  COMPLETED: 'Befejezett',
  ON_HOLD: 'Függőben',
}

export const projectStatusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}
