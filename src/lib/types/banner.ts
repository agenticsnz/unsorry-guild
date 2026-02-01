// Banner message types
// ADR: ADR-011-Banner-Message-System

export type BannerTargetType = 'global' | 'user' | 'system'
export type BannerVariant = 'info' | 'success' | 'warning' | 'celebration'

export interface BannerMessage {
  id: string
  target_type: BannerTargetType
  target_user_id: string | null
  title: string | null
  message: string
  variant: BannerVariant
  also_send_email: boolean
  email_sent_at: string | null
  created_by: string | null
  created_at: string
  expires_at: string | null
  reference_type: string | null
  reference_id: string | null
}

export interface BannerDismissal {
  banner_id: string
  user_id: string
  dismissed_at: string
}

// Banner with dismissal status for display
export interface BannerWithStatus extends BannerMessage {
  is_dismissed: boolean
}

// Create banner input
export interface CreateBannerInput {
  target_type: BannerTargetType
  target_user_id?: string | null
  title?: string | null
  message: string
  variant?: BannerVariant
  also_send_email?: boolean
  expires_at?: string | null
  reference_type?: string | null
  reference_id?: string | null
}

// Variant styling info
export const BANNER_VARIANT_STYLES: Record<BannerVariant, {
  bg: string
  border: string
  text: string
  icon: string
}> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: 'text-amber-500',
  },
  celebration: {
    bg: 'bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-amber-950/30',
    border: 'border-amber-300 dark:border-amber-700',
    text: 'text-amber-900 dark:text-amber-100',
    icon: 'text-amber-500',
  },
}
