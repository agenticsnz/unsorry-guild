'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, PlayCircle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuestList } from '@/components/quests/quest-list'
import { useFeaturedQuests } from '@/lib/hooks/use-featured-quests'
import { useUserActiveQuestIds, useUserAllQuestIds, useUserQuestStatuses } from '@/lib/hooks/use-user-active-quest-ids'

interface SmartQuestSectionProps {
  activeQuests: Array<{
    id: string
    quest_id: string
    quests: {
      id: string
      title: string
      description: string
      points: number
      category_id: string | null
    }
  }>
  isLoading?: boolean
}

export function SmartQuestSection({ activeQuests, isLoading }: SmartQuestSectionProps) {
  const [tab, setTab] = useState<'continue' | 'featured'>(
    activeQuests.length > 0 ? 'continue' : 'featured'
  )

  const { data: featuredQuests, isLoading: loadingFeatured } = useFeaturedQuests()
  const { data: activeQuestIds } = useUserActiveQuestIds()
  const { data: allUserQuestIds } = useUserAllQuestIds()
  const { data: userQuestStatuses } = useUserQuestStatuses()

  const hasActiveQuests = activeQuests.length > 0

  // Filter out quests the user has already started or completed
  const availableFeaturedQuests = featuredQuests?.filter(
    quest => !allUserQuestIds?.has(quest.id)
  ) ?? []

  // Transform active quests to quest format for QuestList
  const activeQuestsData = activeQuests.map(uq => ({
    ...uq.quests,
    category_id: uq.quests.category_id,
  }))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Featured Quests</CardTitle>
          <CardDescription>
            {hasActiveQuests
              ? 'Continue your journey or discover new adventures'
              : 'Discover adventures that await you'}
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/quests">
            View All <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {hasActiveQuests ? (
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'continue' | 'featured')}>
            <TabsList className="mb-4">
              <TabsTrigger value="continue" className="gap-1">
                <PlayCircle className="h-4 w-4" />
                Continue ({activeQuests.length})
              </TabsTrigger>
              <TabsTrigger value="featured" className="gap-1">
                <Sparkles className="h-4 w-4" />
                Featured
              </TabsTrigger>
            </TabsList>

            <TabsContent value="continue">
              {activeQuestsData.length > 0 ? (
                <div className="space-y-4">
                  {activeQuestsData.map(quest => (
                    <Link
                      key={quest.id}
                      href={`/quests/${quest.id}`}
                      className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-medium">{quest.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {quest.description}
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {quest.points} pts
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No active quests. Start a new adventure!
                </p>
              )}
            </TabsContent>

            <TabsContent value="featured">
              {loadingFeatured ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading featured quests...</p>
                </div>
              ) : availableFeaturedQuests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No new featured quests available.</p>
                </div>
              ) : (
                <QuestList
                  quests={availableFeaturedQuests}
                  isLoading={false}
                  activeQuestIds={activeQuestIds}
                  userQuestStatuses={userQuestStatuses}
                />
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <>
            {loadingFeatured ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading featured quests...</p>
              </div>
            ) : availableFeaturedQuests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {allUserQuestIds && allUserQuestIds.size > 0
                    ? "You've completed all available featured quests!"
                    : 'No featured quests available yet.'}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/quests">
                    Browse All Quests
                  </Link>
                </Button>
              </div>
            ) : (
              <QuestList
                quests={availableFeaturedQuests}
                isLoading={false}
                activeQuestIds={activeQuestIds}
                userQuestStatuses={userQuestStatuses}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
