'use client'

import { useActiveBanners, useDismissBanner } from '@/lib/hooks/use-banners'
import { BannerItem } from './banner-item'

/**
 * Displays all active (non-dismissed) banners for the current user.
 * Place this component in the dashboard layout to show banners at the top.
 */
export function BannerDisplay() {
  const { data: banners, isLoading } = useActiveBanners()
  const { mutate: dismiss, isPending: dismissing, variables: dismissingId } = useDismissBanner()

  // Don't render anything while loading or if no banners
  if (isLoading || !banners || banners.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 mb-4">
      {banners.map((banner) => (
        <BannerItem
          key={banner.id}
          banner={banner}
          onDismiss={dismiss}
          dismissing={dismissing && dismissingId === banner.id}
        />
      ))}
    </div>
  )
}
