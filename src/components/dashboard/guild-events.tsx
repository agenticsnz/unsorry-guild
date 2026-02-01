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
}

function parseICSContent(icsContent: string): ParsedEvent[] {
  const events: ParsedEvent[] = []
  const lines = icsContent.split(/\r?\n/)
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
        const value = line.split(':').pop()
        if (value) {
          // Handle both DATE and DATETIME formats
          if (value.includes('T')) {
            currentEvent.date = parseICSDateTime(value)
          } else {
            currentEvent.date = parseICSDate(value)
          }
        }
      } else if (line.startsWith('DTEND')) {
        const value = line.split(':').pop()
        if (value) {
          if (value.includes('T')) {
            currentEvent.endDate = parseICSDateTime(value)
          } else {
            currentEvent.endDate = parseICSDate(value)
          }
        }
      } else if (line.startsWith('LOCATION:')) {
        currentEvent.location = line.substring(9)
      } else if (line.startsWith('URL:')) {
        currentEvent.url = line.substring(4)
      }
    }
  }

  // Filter to future events and sort by date
  return events
    .filter((e) => isFuture(e.date) || isToday(e.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

function parseICSDateTime(value: string): Date {
  // Format: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
  const year = parseInt(value.substring(0, 4))
  const month = parseInt(value.substring(4, 6)) - 1
  const day = parseInt(value.substring(6, 8))
  const hour = parseInt(value.substring(9, 11))
  const minute = parseInt(value.substring(11, 13))
  const second = parseInt(value.substring(13, 15)) || 0

  return new Date(year, month, day, hour, minute, second)
}

function parseICSDate(value: string): Date {
  // Format: YYYYMMDD
  const year = parseInt(value.substring(0, 4))
  const month = parseInt(value.substring(4, 6)) - 1
  const day = parseInt(value.substring(6, 8))

  return new Date(year, month, day)
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
  const dateStr = format(event.date, 'EEE, MMM d')
  const timeStr = format(event.date, 'h:mm a')

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
          {event.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
        </div>
        {event.url && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 mt-1 text-xs"
            asChild
          >
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              View details
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
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
        return
      }

      try {
        const response = await fetch(feedUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch events')
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
