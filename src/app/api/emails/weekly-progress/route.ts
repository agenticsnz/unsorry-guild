import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * POST /api/emails/weekly-progress
 *
 * Triggers sending weekly progress emails to all users who have enabled the feature.
 * Only accessible by GMs. Invokes the user-weekly-progress Edge Function.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is a GM
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is GM (using user_roles table)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)

    const isGm = roles?.some((r: { role: string }) => r.role === 'gm' || r.role === 'admin')

    if (!isGm) {
      return NextResponse.json({ error: 'Forbidden - GM access required' }, { status: 403 })
    }

    console.log(`[Weekly Progress] Manual push triggered by ${user.email}`)

    // Use service client to invoke Edge Function (requires service role key)
    const serviceClient = createServiceClient()

    // Call the Edge Function with manual flag
    const { data, error } = await serviceClient.functions.invoke('user-weekly-progress', {
      body: { manual: true },
    })

    if (error) {
      console.error('Error invoking Edge Function:', error)
      return NextResponse.json(
        { error: `Failed to send emails: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`[Weekly Progress] Edge Function response:`, data)

    return NextResponse.json({
      success: true,
      emailsSent: data?.emailsSent || 0,
      userIds: data?.userIds || [],
      errors: data?.errors,
      message: `Weekly progress email sent to ${data?.emailsSent || 0} users`,
    })
  } catch (error) {
    console.error('Error sending weekly progress emails:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}
