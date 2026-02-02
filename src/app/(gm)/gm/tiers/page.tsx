'use client'

import { useState, useEffect } from 'react'
import { Sprout, TreeDeciduous, Trees, Mountain, Crown, Swords, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useSkillTiers } from '@/lib/hooks/use-skill-tiers'
import { useUpdateAllTiers } from '@/lib/hooks/use-tier-config'
import type { TierConfig } from '@/lib/types/engagement'

const TIER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sprout,
  TreeDeciduous,
  Trees,
  Mountain,
  Crown,
  Swords,
}

const AVAILABLE_ICONS = ['Sprout', 'TreeDeciduous', 'Trees', 'Mountain', 'Crown', 'Swords']
const AVAILABLE_COLORS = ['green', 'emerald', 'teal', 'cyan', 'amber', 'blue', 'red']

export default function TiersPage() {
  const { data: tiers, isLoading } = useSkillTiers()
  const { mutate: updateAllTiers, isPending: saving } = useUpdateAllTiers()

  const [editedTiers, setEditedTiers] = useState<TierConfig[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize edited tiers when data loads
  useEffect(() => {
    if (tiers) {
      setEditedTiers([...tiers])
      setHasChanges(false)
    }
  }, [tiers])

  const handleTierChange = (tierLevel: number, field: keyof TierConfig, value: string | number) => {
    setEditedTiers(prev => prev.map(tier => {
      if (tier.tier_level === tierLevel) {
        return { ...tier, [field]: value }
      }
      return tier
    }))
    setHasChanges(true)
  }

  const handleSave = () => {
    updateAllTiers(editedTiers, {
      onSuccess: () => {
        setHasChanges(false)
      },
    })
  }

  const handleReset = () => {
    if (tiers) {
      setEditedTiers([...tiers])
      setHasChanges(false)
    }
  }

  // Validate point thresholds are ascending
  const validateThresholds = () => {
    const sorted = [...editedTiers].sort((a, b) => a.tier_level - b.tier_level)
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].min_points <= sorted[i - 1].min_points) {
        return false
      }
    }
    return true
  }

  const isValid = validateThresholds()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skill Tiers</h1>
          <p className="text-muted-foreground">
            Configure tier names, thresholds, and appearance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || saving}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || !isValid}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {!isValid && hasChanges && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          Point thresholds must be in ascending order (each tier must require more points than the previous).
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {editedTiers.map((tier) => {
            const Icon = TIER_ICONS[tier.icon] || Sprout

            return (
              <Card key={tier.tier_level}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-${tier.color}-100 dark:bg-${tier.color}-900/20`}>
                      <Icon className={`h-6 w-6 text-${tier.color}-600 dark:text-${tier.color}-400`} />
                    </div>
                    <div>
                      <CardTitle>Tier {tier.tier_level}</CardTitle>
                      <CardDescription>
                        Current: {tier.name} ({tier.min_points.toLocaleString()} points)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${tier.tier_level}`}>Name</Label>
                      <Input
                        id={`name-${tier.tier_level}`}
                        value={tier.name}
                        onChange={(e) => handleTierChange(tier.tier_level, 'name', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`points-${tier.tier_level}`}>Min Points</Label>
                      <Input
                        id={`points-${tier.tier_level}`}
                        type="number"
                        min={tier.tier_level === 1 ? 0 : 1}
                        value={tier.min_points}
                        onChange={(e) => handleTierChange(tier.tier_level, 'min_points', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`icon-${tier.tier_level}`}>Icon</Label>
                      <select
                        id={`icon-${tier.tier_level}`}
                        value={tier.icon}
                        onChange={(e) => handleTierChange(tier.tier_level, 'icon', e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        {AVAILABLE_ICONS.map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`color-${tier.tier_level}`}>Color</Label>
                      <select
                        id={`color-${tier.tier_level}`}
                        value={tier.color}
                        onChange={(e) => handleTierChange(tier.tier_level, 'color', e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        {AVAILABLE_COLORS.map(color => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tier Progression Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Tiers provide a sense of progression for guild members. Points are primarily earned by completing quests.
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tier 1 should always start at 0 points (new members)</li>
            <li>• Each subsequent tier should require more points than the previous</li>
            <li>• Consider your quest catalog when setting thresholds</li>
            <li>• The highest tier should be aspirational but achievable</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
