import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint to fetch ICS calendar feeds
 * This avoids CORS issues when fetching from external services like Lu.ma
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const feedUrl = searchParams.get('url')

  if (!feedUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    )
  }

  // Validate URL format
  try {
    new URL(feedUrl)
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL format' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(feedUrl, {
      headers: {
        'Accept': 'text/calendar, text/plain, */*',
        'User-Agent': 'Guild-Hall-Events/1.0',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch feed: ${response.statusText}` },
        { status: response.status }
      )
    }

    const content = await response.text()

    // Return the ICS content with appropriate headers
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    })
  } catch (error) {
    console.error('Error fetching events feed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events feed' },
      { status: 500 }
    )
  }
}
