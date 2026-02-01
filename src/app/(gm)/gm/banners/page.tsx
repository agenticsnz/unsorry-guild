'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Megaphone, User, Sparkles, Trash2, Mail, MailCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAllBanners, useCreateBanner, useDeleteBanner } from '@/lib/hooks/use-banners'
import { useAllUsers } from '@/lib/hooks/use-all-users'
import type { BannerVariant, BannerTargetType } from '@/lib/types/banner'
import { BANNER_VARIANT_STYLES } from '@/lib/types/banner'
import { cn } from '@/lib/utils'

const VARIANT_ICONS: Record<BannerVariant, typeof Megaphone> = {
  info: Megaphone,
  success: Sparkles,
  warning: Megaphone,
  celebration: Sparkles,
}

const TARGET_TYPE_LABELS: Record<BannerTargetType, string> = {
  global: 'Global (All Users)',
  user: 'Private (Specific User)',
  system: 'System (Auto-generated)',
}

export default function BannersPage() {
  const { data: banners, isLoading } = useAllBanners()
  const { data: users } = useAllUsers()
  const { mutate: createBanner, isPending: creating } = useCreateBanner()
  const { mutate: deleteBanner, isPending: deleting } = useDeleteBanner()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    target_type: 'global' as BannerTargetType,
    target_user_id: '',
    title: '',
    message: '',
    variant: 'info' as BannerVariant,
    also_send_email: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createBanner({
      target_type: formData.target_type,
      target_user_id: formData.target_type === 'user' ? formData.target_user_id : null,
      title: formData.title || null,
      message: formData.message,
      variant: formData.variant,
      also_send_email: formData.also_send_email,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false)
        setFormData({
          target_type: 'global',
          target_user_id: '',
          title: '',
          message: '',
          variant: 'info',
          also_send_email: false,
        })
      },
    })
  }

  const handleDelete = (bannerId: string) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      deleteBanner(bannerId)
    }
  }

  // Get user name by ID
  const getUserName = (userId: string | null) => {
    if (!userId) return null
    const user = users?.find(u => u.id === userId)
    return user?.display_name || user?.email || 'Unknown User'
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-muted-foreground">
            Send announcements and messages to guild members.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Create Banner</DialogTitle>
                <DialogDescription>
                  Send an announcement or private message to guild members.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="target_type">Target</Label>
                  <Select
                    value={formData.target_type}
                    onValueChange={(value: BannerTargetType) =>
                      setFormData(prev => ({ ...prev, target_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global (All Users)</SelectItem>
                      <SelectItem value="user">Private (Specific User)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.target_type === 'user' && (
                  <div className="grid gap-2">
                    <Label htmlFor="target_user_id">User</Label>
                    <Select
                      value={formData.target_user_id}
                      onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, target_user_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.display_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="variant">Style</Label>
                  <Select
                    value={formData.variant}
                    onValueChange={(value: BannerVariant) =>
                      setFormData(prev => ({ ...prev, variant: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info (Blue)</SelectItem>
                      <SelectItem value="success">Success (Green)</SelectItem>
                      <SelectItem value="warning">Warning (Amber)</SelectItem>
                      <SelectItem value="celebration">Celebration (Gold)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Banner title"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Your message to the guild..."
                    required
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="also_send_email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Also send email
                  </Label>
                  <Switch
                    id="also_send_email"
                    checked={formData.also_send_email}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, also_send_email: checked }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating || !formData.message || (formData.target_type === 'user' && !formData.target_user_id)}
                >
                  {creating ? 'Creating...' : 'Create Banner'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Banner List */}
      <Card>
        <CardHeader>
          <CardTitle>All Banners</CardTitle>
          <CardDescription>View and manage all banner messages</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : !banners || banners.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No banners yet. Create one to send an announcement to your guild.
            </p>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => {
                const styles = BANNER_VARIANT_STYLES[banner.variant]
                const Icon = VARIANT_ICONS[banner.variant]
                const targetUserName = getUserName(banner.target_user_id)

                return (
                  <div
                    key={banner.id}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-lg border',
                      styles.bg,
                      styles.border
                    )}
                  >
                    <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {banner.title && (
                            <h4 className={cn('font-semibold', styles.text)}>
                              {banner.title}
                            </h4>
                          )}
                          <p className={cn('text-sm', styles.text)}>
                            {banner.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {banner.target_type === 'global' && (
                            <Badge variant="outline">
                              <Megaphone className="h-3 w-3 mr-1" />
                              Global
                            </Badge>
                          )}
                          {banner.target_type === 'user' && (
                            <Badge variant="outline">
                              <User className="h-3 w-3 mr-1" />
                              {targetUserName}
                            </Badge>
                          )}
                          {banner.target_type === 'system' && (
                            <Badge variant="outline">
                              <Sparkles className="h-3 w-3 mr-1" />
                              System
                            </Badge>
                          )}
                          {banner.also_send_email && (
                            <Badge variant="outline" className="text-xs">
                              {banner.email_sent_at ? (
                                <><MailCheck className="h-3 w-3 mr-1" /> Sent</>
                              ) : (
                                <><Mail className="h-3 w-3 mr-1" /> Pending</>
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(banner.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => handleDelete(banner.id)}
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
