'use client'

import { useState, useEffect } from 'react'
import { format, parseISO, isFuture, isToday, isTomorrow, isThisWeek } from 'date-fns'
import { Calendar, ExternalLink, MapPin, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { GuildEvent } from '@/lib/types/engagement'
import { cn } from '@/lib/utils'

interface GuildEventsProps {
  feedUrl?: string
  className?: string
}

interface ParsedEvent {
  id: string
  title: string
  date: Date
  endDate?: Date
  location?: string
  url?: string
  description?: string
}

function parseICSContent(icsContent: string): ParsedEvent[] {
  const events: ParsedEvent[] = []

  // Unfold ICS content - lines starting with space/tab are continuations
  const unfoldedContent = icsContent.replace(/\r?\n[ \t]/g, '')
  const lines = unfoldedContent.split(/\r?\n/)

  let currentEvent: Partial<ParsedEvent> = {}
  let inEvent = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      currentEvent = { id: `event-${i}` }
    } else if (line === 'END:VEVENT' && inEvent) {
      if (currentEvent.title && currentEvent.date) {
        events.push(currentEvent as ParsedEvent)
      }
      currentEvent = {}
      inEvent = false
    } else if (inEvent) {
      if (line.startsWith('SUMMARY:')) {
        currentEvent.title = line.substring(8)
      } else if (line.startsWith('DTSTART')) {
        // Handle DTSTART with or without TZID parameter
        // Format: DTSTART:20260225T180000Z or DTSTART;TZID=Pacific/Auckland:20260225T180000
        const colonIndex = line.indexOf(':')
        if (colonIndex !== -1) {
          const value = line.substring(colonIndex + 1)
          const params = line.substring(0, colonIndex)
          const tzMatch = params.match(/TZID=([^;:]+)/i)
          const timezone = tzMatch ? tzMatch[1] : undefined

          if (value.includes('T')) {
            currentEvent.date = parseICSDateTime(value, timezone)
          } else {
            currentEvent.date = parseICSDate(value)
          }
        }
      } else if (line.startsWith('DTEND')) {
        const colonIndex = line.indexOf(':')
        if (colonIndex !== -1) {
          const value = line.substring(colonIndex + 1)
          const params = line.substring(0, colonIndex)
          const tzMatch = params.match(/TZID=([^;:]+)/i)
          const timezone = tzMatch ? tzMatch[1] : undefined

          if (value.includes('T')) {
            currentEvent.endDate = parseICSDateTime(value, timezone)
          } else {
            currentEvent.endDate = parseICSDate(value)
          }
        }
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9)
      } else if (line.startsWith('URL:')) {
        currentEvent.url = line.substring(4)
      } else if (line.startsWith('DESCRIPTION:')) {
        // ICS descriptions use \n for newlines, unescape them
        currentEvent.description = line.substring(12).replace(/\\n/g, '\n').replace(/\\,/g, ',')
      }
    }
  }

  // Filter to future events and sort by date
  return events
    .filter((e) => isFuture(e.date) || isToday(e.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

function parseICSDateTime(value: string, timezone?: string): Date {
  // Format: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
  const year = parseInt(value.substring(0, 4))
  const month = parseInt(value.substring(4, 6)) - 1
  const day = parseInt(value.substring(6, 8))
  const hour = parseInt(value.substring(9, 11))
  const minute = parseInt(value.substring(11, 13))
  const second = parseInt(value.substring(13, 15)) || 0

  // If ends with Z, it's UTC
  if (value.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second))
  }

  // If timezone is provided, create date in that timezone
  // For simplicity, if it's Pacific/Auckland, we assume the time is NZ local time
  // and create the date accordingly (browser will handle display)
  if (timezone) {
    // Create an ISO string and parse with timezone awareness
    const isoString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
    try {
      // Use Intl to get the offset for the timezone at that date
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      // Create date assuming local timezone, then adjust
      // This is a simplified approach - just return the date as-is
      // since we're displaying in the same timezone context
      return new Date(year, month, day, hour, minute, second)
    } catch {
      // If timezone parsing fails, fall back to local time
      return new Date(year, month, day, hour, minute, second)
    }
  }

  // No timezone info, assume local time
  return new Date(year, month, day, hour, minute, second)
}

function parseICSDate(value: string): Date {
  // Format: YYYYMMDD
  const year = parseInt(value.substring(0, 4))
  const month = parseInt(value.substring(4, 6)) - 1
  const day = parseInt(value.substring(6, 8))

  return new Date(year, month, day)
}

/**
 * Extract first 2 paragraphs from event description, filtering out boilerplate
 */
function getFirstTwoParagraphs(text: string): string {
  // Filter out boilerplate lines like "Get up-to-date information at:"
  const cleanedText = text
    .split(/\n/)
    .filter(line => !line.trim().toLowerCase().startsWith('get up-to-date'))
    .join('\n')

  const paragraphs = cleanedText.split(/\n\n|\r\n\r\n/).filter(p => p.trim())
  return paragraphs.slice(0, 2).join('\n\n').trim()
}

/**
 * Check if a string looks like a URL
 */
function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://')
}

function getEventDateBadge(date: Date): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } | null {
  if (isToday(date)) {
    return { label: 'Today', variant: 'destructive' }
  }
  if (isTomorrow(date)) {
    return { label: 'Tomorrow', variant: 'default' }
  }
  if (isThisWeek(date)) {
    return { label: 'This week', variant: 'secondary' }
  }
  return null
}

function EventItemSkeleton() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function EventItem({ event }: { event: ParsedEvent }) {
  const dateBadge = getEventDateBadge(event.date)
  const timeStr = format(event.date, 'h:mm a')

  // If location is a URL, use it as the event URL instead
  const locationIsUrl = event.location && isUrl(event.location)
  const displayLocation = locationIsUrl ? undefined : event.location
  const eventUrl = event.url || (locationIsUrl ? event.location : undefined)

  // Clean description - filter out empty or boilerplate-only results
  const cleanDescription = event.description ? getFirstTwoParagraphs(event.description) : undefined
  const showDescription = cleanDescription && cleanDescription.length > 0

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="flex flex-col items-center justify-center h-12 w-12 bg-primary/10 rounded-lg shrink-0">
        <span className="text-xs font-medium text-primary uppercase">
          {format(event.date, 'MMM')}
        </span>
        <span className="text-lg font-bold text-primary leading-none">
          {format(event.date, 'd')}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <h4 className="font-medium text-sm leading-tight">{event.title}</h4>
          {dateBadge && (
            <Badge variant={dateBadge.variant} className="text-xs px-1.5 py-0">
              {dateBadge.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeStr}
          </span>
          {displayLocation && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{displayLocation}</span>
            </span>
          )}
        </div>
        {showDescription && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
            {cleanDescription}
          </p>
        )}
        {eventUrl && (
          <a
            href={eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary hover:underline"
          >
            View details
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  )
}

export function GuildEvents({ feedUrl, className }: GuildEventsProps) {
  const [events, setEvents] = useState<ParsedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      if (!feedUrl) {
        setIsLoading(false)
        setEvents([]) // No events to show
        return
      }

      try {
        // Use our API route to proxy the ICS feed (avoids CORS issues)
        const proxyUrl = `/api/events/feed?url=${encodeURIComponent(feedUrl)}`
        const response = await fetch(proxyUrl)

        if (!response.ok) {
          // If proxy fails, try direct fetch as fallback
          const directResponse = await fetch(feedUrl)
          if (!directResponse.ok) {
            throw new Error('Failed to fetch events')
          }
          const icsContent = await directResponse.text()
          const parsedEvents = parseICSContent(icsContent)
          setEvents(parsedEvents.slice(0, 5))
          setError(null)
          return
        }

        const icsContent = await response.text()
        const parsedEvents = parseICSContent(icsContent)
        setEvents(parsedEvents.slice(0, 5)) // Limit to 5 upcoming events
        setError(null)
      } catch (err) {
        console.error('Error fetching guild events:', err)
        setError('Unable to load events')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvents()
  }, [feedUrl])

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div>
            <EventItemSkeleton />
            <EventItemSkeleton />
            <EventItemSkeleton />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming events</p>
            <p className="text-xs text-muted-foreground mt-1">
              Check back later for guild gatherings and workshops.
            </p>
          </div>
        ) : (
          <div className="max-h-[350px] overflow-y-auto">
            {events.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function GuildEventsSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        <EventItemSkeleton />
        <EventItemSkeleton />
        <EventItemSkeleton />
      </CardContent>
    </Card>
  )
}
