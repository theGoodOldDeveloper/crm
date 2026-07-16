export type { Contact, Project, Touchpoint, CalendarEvent, User, ProjectStatus, TouchpointType } from '@prisma/client'

export interface ContactWithProjects {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  projects: Array<{
    project: {
      id: string
      name: string
      status: string
    }
  }>
  touchpoints?: TouchpointWithContact[]
  _count?: {
    touchpoints: number
    projects: number
  }
}

export interface ProjectWithContacts {
  id: string
  name: string
  status: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  contacts: Array<{
    contact: {
      id: string
      name: string
      company: string | null
      email: string | null
    }
  }>
  _count?: {
    touchpoints: number
    contacts: number
  }
}

export interface TouchpointWithContact {
  id: string
  contactId: string
  projectId: string | null
  type: string
  date: Date
  duration: number | null
  notes: string | null
  createdAt: Date
  contact: {
    id: string
    name: string
    company: string | null
  }
  project?: {
    id: string
    name: string
  } | null
}

export interface CalendarEventFull {
  id: string
  googleEventId: string | null
  title: string
  description: string | null
  startTime: Date
  endTime: Date
  touchpointId: string | null
  createdAt: Date
  updatedAt: Date
  touchpoint?: {
    id: string
    type: string
    contact: {
      id: string
      name: string
    }
  } | null
}

export interface DashboardStats {
  totalContacts: number
  activeProjects: number
  touchpointsThisMonth: number
  upcomingEvents: CalendarEventFull[]
  recentTouchpoints: TouchpointWithContact[]
}
