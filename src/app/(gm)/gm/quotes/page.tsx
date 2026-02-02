'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Plus, Quote, Trash2, Edit2, Eye, EyeOff } from 'lucide-react'
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
import { useAllQuotes, useCreateQuote, useUpdateQuote, useDeleteQuote } from '@/lib/hooks/use-quotes'
import type { PhilosophyQuote } from '@/lib/types/engagement'

export default function QuotesPage() {
  const { data: quotes, isLoading } = useAllQuotes()
  const { mutate: createQuote, isPending: creating } = useCreateQuote()
  const { mutate: updateQuote, isPending: updating } = useUpdateQuote()
  const { mutate: deleteQuote, isPending: deleting } = useDeleteQuote()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingQuote, setEditingQuote] = useState<PhilosophyQuote | null>(null)
  const [formData, setFormData] = useState({
    quote: '',
    attribution: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingQuote) {
      updateQuote({
        id: editingQuote.id,
        quote: formData.quote,
        attribution: formData.attribution || null,
      }, {
        onSuccess: () => {
          setIsDialogOpen(false)
          setEditingQuote(null)
          setFormData({ quote: '', attribution: '' })
        },
      })
    } else {
      createQuote({
        quote: formData.quote,
        attribution: formData.attribution || null,
      }, {
        onSuccess: () => {
          setIsDialogOpen(false)
          setFormData({ quote: '', attribution: '' })
        },
      })
    }
  }

  const handleEdit = (quote: PhilosophyQuote) => {
    setEditingQuote(quote)
    setFormData({
      quote: quote.quote,
      attribution: quote.attribution || '',
    })
    setIsDialogOpen(true)
  }

  const handleToggleActive = (quote: PhilosophyQuote) => {
    updateQuote({
      id: quote.id,
      is_active: !quote.is_active,
    })
  }

  const handleDelete = (quoteId: string) => {
    if (confirm('Are you sure you want to delete this quote?')) {
      deleteQuote(quoteId)
    }
  }

  const handleOpenCreate = () => {
    setEditingQuote(null)
    setFormData({ quote: '', attribution: '' })
    setIsDialogOpen(true)
  }

  const activeCount = quotes?.filter(q => q.is_active).length || 0
  const inactiveCount = quotes?.filter(q => !q.is_active).length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Philosophy Quotes</h1>
          <p className="text-muted-foreground">
            Manage quotes displayed on the dashboard
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Quote
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingQuote ? 'Edit Quote' : 'Add New Quote'}</DialogTitle>
              <DialogDescription>
                {editingQuote
                  ? 'Update the quote text or attribution.'
                  : 'Add an inspiring quote to the rotation.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="quote">Quote Text</Label>
                  <Textarea
                    id="quote"
                    placeholder="Enter the quote..."
                    value={formData.quote}
                    onChange={(e) => setFormData(prev => ({ ...prev, quote: e.target.value }))}
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attribution">Attribution (optional)</Label>
                  <Input
                    id="attribution"
                    placeholder="e.g., Agentics NZ"
                    value={formData.attribution}
                    onChange={(e) => setFormData(prev => ({ ...prev, attribution: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank for anonymous or guild quotes.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating || updating}>
                  {creating || updating ? 'Saving...' : editingQuote ? 'Update' : 'Add Quote'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{quotes?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-muted-foreground">{inactiveCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quotes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotes</CardTitle>
          <CardDescription>
            Active quotes are shown in rotation on the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !quotes || quotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No quotes yet. Add your first quote to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className={`flex items-start justify-between gap-4 p-4 rounded-lg border ${
                    quote.is_active ? 'bg-background' : 'bg-muted/50 opacity-60'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Quote className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      {quote.is_active ? (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                      {quote.display_order && (
                        <Badge variant="outline" className="text-xs">
                          Order: {quote.display_order}
                        </Badge>
                      )}
                    </div>
                    <p className="italic text-sm">&ldquo;{quote.quote}&rdquo;</p>
                    {quote.attribution && (
                      <p className="text-sm text-muted-foreground mt-1">
                        — {quote.attribution}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Added {formatDistanceToNow(new Date(quote.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(quote)}
                      title={quote.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {quote.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(quote)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(quote.id)}
                      disabled={deleting}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
