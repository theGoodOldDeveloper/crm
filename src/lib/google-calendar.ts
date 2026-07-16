import { google } from 'googleapis'
import { prisma } from './prisma'

const SCOPES = ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export function getAuthUrl(): string {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export async function getTokensFromCode(code: string) {
  const oauth2Client = createOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  return tokens
}

export async function getUserInfo(accessToken: string) {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const { data } = await oauth2.userinfo.get()
  return data
}

export async function getCalendarClient(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.googleRefreshToken) throw new Error('Google Calendar not connected')

  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    refresh_token: user.googleRefreshToken,
    access_token: user.googleAccessToken || undefined,
    expiry_date: user.tokenExpiry ? user.tokenExpiry.getTime() : undefined,
  })

  // Auto-refresh if needed
  oauth2Client.on('tokens', async (tokens) => {
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: tokens.access_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
      },
    })
  })

  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function createGoogleEvent(
  userId: string,
  event: {
    title: string
    description?: string
    startTime: Date
    endTime: Date
  }
) {
  const calendar = await getCalendarClient(userId)
  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime.toISOString() },
      end: { dateTime: event.endTime.toISOString() },
    },
  })
  return response.data
}

export async function updateGoogleEvent(
  userId: string,
  googleEventId: string,
  event: {
    title: string
    description?: string
    startTime: Date
    endTime: Date
  }
) {
  const calendar = await getCalendarClient(userId)
  const response = await calendar.events.update({
    calendarId: 'primary',
    eventId: googleEventId,
    requestBody: {
      summary: event.title,
      description: event.description,
      start: { dateTime: event.startTime.toISOString() },
      end: { dateTime: event.endTime.toISOString() },
    },
  })
  return response.data
}

export async function deleteGoogleEvent(userId: string, googleEventId: string) {
  const calendar = await getCalendarClient(userId)
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleEventId,
  })
}

export async function syncFromGoogle(userId: string) {
  const calendar = await getCalendarClient(userId)

  const now = new Date()
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const threeMonthsAhead = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: oneMonthAgo.toISOString(),
    timeMax: threeMonthsAhead.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  })

  const events = response.data.items || []
  let synced = 0

  for (const event of events) {
    if (!event.id || !event.start?.dateTime || !event.end?.dateTime) continue

    await prisma.calendarEvent.upsert({
      where: { googleEventId: event.id },
      create: {
        googleEventId: event.id,
        title: event.summary || '(Névtelen esemény)',
        description: event.description || undefined,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
      },
      update: {
        title: event.summary || '(Névtelen esemény)',
        description: event.description || undefined,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
      },
    })
    synced++
  }

  return synced
}
