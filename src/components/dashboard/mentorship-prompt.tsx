'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, X, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MentorshipPromptProps {
  userTierLevel: number
  mentorshipSignupUrl?: string
  className?: string
}

const MENTORSHIP_DISMISSED_KEY = 'guild-hall-mentorship-prompt-dismissed'
const EXPERT_TIER_LEVEL = 3 // Expert is tier level 3

export function MentorshipPrompt({
  userTierLevel,
  mentorshipSignupUrl = '/mentorship',
  className,
}: MentorshipPromptProps) {
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden to avoid flash

  useEffect(() => {
    // Check session storage for dismissal
    const dismissed = sessionStorage.getItem(MENTORSHIP_DISMISSED_KEY)
    setIsDismissed(dismissed === 'true')
  }, [])

  const handleDismiss = () => {
    sessionStorage.setItem(MENTORSHIP_DISMISSED_KEY, 'true')
    setIsDismissed(true)
  }

  // Only show for Expert tier (level 3) and above
  if (userTierLevel < EXPERT_TIER_LEVEL) {
    return null
  }

  // Don't show if dismissed this session
  if (isDismissed) {
    return null
  }

  return (
    <Card className={cn('bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-teal-200 dark:border-teal-800', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-100 dark:bg-teal-900/50 rounded-full shrink-0">
            <GraduationCap className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-teal-900 dark:text-teal-100">
              Ready to guide others?
            </h4>
            <p className="text-sm text-teal-700 dark:text-teal-300 mt-1">
              Your experience could help fellow guild members on their journey.
              Consider becoming a mentor and share your wisdom.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                asChild
              >
                <a
                  href={mentorshipSignupUrl}
                  target={mentorshipSignupUrl.startsWith('http') ? '_blank' : undefined}
                  rel={mentorshipSignupUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-1"
                >
                  Learn about mentorship
                  {mentorshipSignupUrl.startsWith('http') && (
                    <ExternalLink className="h-3 w-3" />
                  )}
                </a>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
              >
                Maybe later
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 shrink-0 text-teal-500 hover:text-teal-700 dark:hover:text-teal-300"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
