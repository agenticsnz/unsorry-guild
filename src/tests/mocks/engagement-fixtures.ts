// Engagement feature test fixtures
// ADR: ADR-012-Engagement-Improvements

import type {
  TierConfig,
  TierInfo,
  StreakInfo,
  UserStreak,
  PhilosophyQuote,
  GreetingContext,
  GreetingData,
  NudgeBannerData,
  GMEmailPreferences,
  UserWeeklyEmailPrefs,
  WeekendBehavior,
  GreetingPriority,
  NudgePriority,
  EnrichedStats,
} from '@/lib/types/engagement'

// ============================================================
// Tier Config Fixtures
// ============================================================

export const mockTierConfigs: TierConfig[] = [
  { tier_level: 1, name: 'Apprentice', min_points: 0, icon: 'Sprout', color: 'green' },
  { tier_level: 2, name: 'Journeyman', min_points: 300, icon: 'TreeDeciduous', color: 'emerald' },
  { tier_level: 3, name: 'Expert', min_points: 600, icon: 'Trees', color: 'teal' },
  { tier_level: 4, name: 'Master', min_points: 1200, icon: 'Mountain', color: 'cyan' },
  { tier_level: 5, name: 'Legend', min_points: 2400, icon: 'Crown', color: 'amber' },
]

export const mockApprenticeTierInfo: TierInfo = {
  tier: mockTierConfigs[0],
  points: 150,
  nextTier: mockTierConfigs[1],
  pointsToNext: 150,
  progressPercent: 50,
}

export const mockJourneymanTierInfo: TierInfo = {
  tier: mockTierConfigs[1],
  points: 450,
  nextTier: mockTierConfigs[2],
  pointsToNext: 150,
  progressPercent: 50,
}

export const mockExpertTierInfo: TierInfo = {
  tier: mockTierConfigs[2],
  points: 800,
  nextTier: mockTierConfigs[3],
  pointsToNext: 400,
  progressPercent: 33.33,
}

export const mockMasterTierInfo: TierInfo = {
  tier: mockTierConfigs[3],
  points: 1800,
  nextTier: mockTierConfigs[4],
  pointsToNext: 600,
  progressPercent: 50,
}

export const mockLegendTierInfo: TierInfo = {
  tier: mockTierConfigs[4],
  points: 3000,
  nextTier: null,
  pointsToNext: 0,
  progressPercent: 100,
}

export function createMockTierConfig(overrides: Partial<TierConfig> = {}): TierConfig {
  return {
    ...mockTierConfigs[0],
    ...overrides,
  }
}

export function createMockTierInfo(overrides: Partial<TierInfo> = {}): TierInfo {
  return {
    ...mockApprenticeTierInfo,
    ...overrides,
  }
}

// ============================================================
// Streak Fixtures
// ============================================================

export const mockUserStreak: UserStreak = {
  user_id: 'user-123',
  current_streak: 7,
  longest_streak: 14,
  last_activity_date: new Date().toISOString().split('T')[0],
  weekend_behavior: 'weekends_count',
  timezone: 'Pacific/Auckland',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: new Date().toISOString(),
}

export const mockStreakInfo: StreakInfo = {
  currentStreak: 7,
  longestStreak: 14,
  lastActivityDate: new Date().toISOString().split('T')[0],
  weekendBehavior: 'weekends_count',
  isStreakAtRisk: false,
}

export const mockStreakAtRisk: StreakInfo = {
  currentStreak: 5,
  longestStreak: 10,
  lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  weekendBehavior: 'weekends_count',
  isStreakAtRisk: true,
}

export const mockNewUserStreak: StreakInfo = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null,
  weekendBehavior: 'weekends_count',
  isStreakAtRisk: false,
}

export function createMockStreak(overrides: Partial<StreakInfo> = {}): StreakInfo {
  return {
    ...mockStreakInfo,
    ...overrides,
  }
}

export function createMockUserStreak(overrides: Partial<UserStreak> = {}): UserStreak {
  return {
    ...mockUserStreak,
    user_id: `user-${Date.now()}`,
    ...overrides,
  }
}

// ============================================================
// Philosophy Quote Fixtures
// ============================================================

export const mockQuotes: PhilosophyQuote[] = [
  {
    id: 'quote-001',
    quote: 'The best way to predict the future is to create it.',
    attribution: 'Peter Drucker',
    is_active: true,
    display_order: null,
    created_by: 'gm-456',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'quote-002',
    quote: 'In the age of AI, the most human skills become the most valuable.',
    attribution: 'Agentics NZ',
    is_active: true,
    display_order: null,
    created_by: 'gm-456',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'quote-003',
    quote: 'The guild grows stronger when each member grows stronger.',
    attribution: null,
    is_active: true,
    display_order: null,
    created_by: null,
    created_at: '2024-01-03T00:00:00.000Z',
    updated_at: '2024-01-03T00:00:00.000Z',
  },
]

export const mockInactiveQuote: PhilosophyQuote = {
  id: 'quote-inactive',
  quote: 'This quote is not shown.',
  attribution: null,
  is_active: false,
  display_order: null,
  created_by: 'gm-456',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export function createMockQuote(overrides: Partial<PhilosophyQuote> = {}): PhilosophyQuote {
  return {
    ...mockQuotes[0],
    id: `quote-${Date.now()}`,
    ...overrides,
  }
}

// ============================================================
// Greeting Context Fixtures
// ============================================================

export const mockCelebrationGreeting: GreetingContext = {
  priority: 'celebration',
  message: 'Congratulations on completing Agent Swarm Commander!',
  subMessage: 'You earned 150 points!',
  icon: 'PartyPopper',
}

export const mockActionGreeting: GreetingContext = {
  priority: 'action',
  message: 'You have 2 objectives ready to progress!',
  subMessage: 'Check your active quests',
  icon: 'ArrowRight',
}

export const mockProgressionGreeting: GreetingContext = {
  priority: 'progression',
  message: 'Just 50 points from Expert tier!',
  subMessage: 'Complete one more objective',
  icon: 'TrendingUp',
}

export const mockTimeGreetingMorning: GreetingContext = {
  priority: 'time',
  message: 'Good morning, Test Adventurer',
  icon: 'Sun',
}

export const mockTimeGreetingAfternoon: GreetingContext = {
  priority: 'time',
  message: 'Good afternoon, Test Adventurer',
  icon: 'Sun',
}

export const mockTimeGreetingEvening: GreetingContext = {
  priority: 'time',
  message: 'Good evening, Test Adventurer',
  icon: 'Moon',
}

export function createMockGreetingContext(
  overrides: Partial<GreetingContext> = {}
): GreetingContext {
  return {
    ...mockTimeGreetingMorning,
    ...overrides,
  }
}

export const mockGreetingData: GreetingData = {
  recentlyCompletedQuests: [],
  previousTierLevel: null,
  currentTierLevel: 1,
  approvedObjectivesCount: 0,
  upcomingDeadlines: [],
  pointsToNextTier: 150,
  nextTierName: 'Journeyman',
  currentStreak: 7,
  displayName: 'Test Adventurer',
  localHour: 10,
}

export const mockGreetingDataWithCelebration: GreetingData = {
  ...mockGreetingData,
  recentlyCompletedQuests: [
    {
      quest_id: 'quest-001',
      quest_title: 'Agent Swarm Commander',
      completed_at: new Date().toISOString(),
    },
  ],
}

export const mockGreetingDataWithAction: GreetingData = {
  ...mockGreetingData,
  approvedObjectivesCount: 2,
}

export const mockGreetingDataWithDeadline: GreetingData = {
  ...mockGreetingData,
  upcomingDeadlines: [
    {
      quest_id: 'quest-002',
      quest_title: 'The Sovereign Engine',
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      days_remaining: 2,
    },
  ],
}

// ============================================================
// Nudge Banner Fixtures
// ============================================================

export const mockNudgeApprovedReady: NudgeBannerData = {
  priority: 'approved_ready',
  message: 'You have 2 objectives approved and ready to continue!',
  actionUrl: '/my-quests',
  actionLabel: 'Continue Quest',
  variant: 'info',
}

export const mockNudgeDeadlineSoon: NudgeBannerData = {
  priority: 'deadline_soon',
  message: '"The Sovereign Engine" is due in 2 days!',
  actionUrl: '/quests/quest-002',
  actionLabel: 'View Quest',
  variant: 'warning',
}

export const mockNudgeCelebration: NudgeBannerData = {
  priority: 'celebration',
  message: 'You reached Journeyman tier! Well done!',
  actionUrl: '/profile',
  actionLabel: 'View Progress',
  variant: 'celebration',
}

export const mockNudgeQuestRecommendation: NudgeBannerData = {
  priority: 'quest_recommendation',
  message: 'Ready for a new challenge? "Agent Swarm Commander" might be perfect for you.',
  actionUrl: '/quests/quest-001',
  actionLabel: 'View Quest',
  variant: 'info',
}

export function createMockNudgeBanner(
  overrides: Partial<NudgeBannerData> = {}
): NudgeBannerData {
  return {
    ...mockNudgeApprovedReady,
    ...overrides,
  }
}

// ============================================================
// Email Preferences Fixtures
// ============================================================

export const mockGMEmailPreferences: GMEmailPreferences = {
  user_id: 'gm-456',
  daily_digest_enabled: true,
  digest_time: '08:00',
  timezone: 'Pacific/Auckland',
  last_digest_sent_at: null,
  default_quest_filter: 'published',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockGMEmailPreferencesDisabled: GMEmailPreferences = {
  ...mockGMEmailPreferences,
  daily_digest_enabled: false,
}

export function createMockGMEmailPreferences(
  overrides: Partial<GMEmailPreferences> = {}
): GMEmailPreferences {
  return {
    ...mockGMEmailPreferences,
    user_id: `gm-${Date.now()}`,
    ...overrides,
  }
}

export const mockUserWeeklyEmailPrefs: UserWeeklyEmailPrefs = {
  user_id: 'user-123',
  enabled: true,
  day_of_week: 1, // Monday
  send_time: '08:00',
  timezone: 'Pacific/Auckland',
  last_sent_at: null,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
}

export const mockUserWeeklyEmailPrefsDisabled: UserWeeklyEmailPrefs = {
  ...mockUserWeeklyEmailPrefs,
  enabled: false,
}

export function createMockUserWeeklyEmailPrefs(
  overrides: Partial<UserWeeklyEmailPrefs> = {}
): UserWeeklyEmailPrefs {
  return {
    ...mockUserWeeklyEmailPrefs,
    user_id: `user-${Date.now()}`,
    ...overrides,
  }
}

// ============================================================
// Enriched Stats Fixtures
// ============================================================

export const mockEnrichedStats: EnrichedStats = {
  totalPoints: 450,
  rank: 5,
  totalUsers: 25,
  activeQuests: 2,
  completedQuests: 3,
  pendingObjectives: 2,
  approvedObjectives: 1,
  tier: mockJourneymanTierInfo,
  streak: mockStreakInfo,
}

export const mockNewUserEnrichedStats: EnrichedStats = {
  totalPoints: 0,
  rank: 25,
  totalUsers: 25,
  activeQuests: 0,
  completedQuests: 0,
  pendingObjectives: 0,
  approvedObjectives: 0,
  tier: {
    tier: mockTierConfigs[0],
    points: 0,
    nextTier: mockTierConfigs[1],
    pointsToNext: 300,
    progressPercent: 0,
  },
  streak: mockNewUserStreak,
}

export function createMockEnrichedStats(
  overrides: Partial<EnrichedStats> = {}
): EnrichedStats {
  return {
    ...mockEnrichedStats,
    ...overrides,
  }
}
