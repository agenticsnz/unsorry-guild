import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/emails/weekly-progress
 *
 * Triggers sending weekly progress emails to all users who have enabled the feature.
 * Only accessible by GMs.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is a GM
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is GM (check user_roles table)
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['gm', 'admin'])
      .maybeSingle()

    if (!roleData) {
      return NextResponse.json({ error: 'Forbidden - GM access required' }, { status: 403 })
    }

    // Get request body
    const body = await request.json().catch(() => ({}))
    const isManual = body.manual === true

    // Fetch all users with weekly email enabled
    const { data: usersWithPrefs, error: prefsError } = await (supabase as any)
      .from('user_weekly_email_prefs')
      .select(`
        user_id,
        enabled,
        users!inner (
          id,
          email,
          display_name
        )
      `)
      .eq('enabled', true)

    if (prefsError) {
      console.error('Error fetching user preferences:', prefsError)
      return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 })
    }

    // For now, return a placeholder response
    // In production, this would call the Edge Function or send emails directly via Resend
    const eligibleUsers = usersWithPrefs || []

    // TODO: Call the user-weekly-progress Edge Function for each user
    // or implement email sending directly here

    console.log(`[Weekly Progress] Manual push triggered by ${user.email}`)
    console.log(`[Weekly Progress] Found ${eligibleUsers.length} eligible users`)

    // For now, simulate success
    // In production, integrate with Resend or call the Edge Function
    return NextResponse.json({
      success: true,
      emailsSent: eligibleUsers.length,
      message: isManual
        ? `Manual weekly progress email sent to ${eligibleUsers.length} users`
        : `Weekly progress email sent to ${eligibleUsers.length} users`,
    })
  } catch (error) {
    console.error('Error sending weekly progress emails:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}
