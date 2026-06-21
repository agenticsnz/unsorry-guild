-- Migration: 204_seed_prize_sq_add_sq
-- Description: Seed the first flagship-target prize for the Math domain. ADR-018.
-- Specification: SPEC-018-A-Prize-Model

INSERT INTO prizes (domain_id, headline_goal_id, title, description, badge_emoji, status)
VALUES (
  'math',
  'sq-add-sq-eq-three-mul-sq',
  'Sum of Two Squares = 3·Square',
  'Prove sq-add-sq-eq-three-mul-sq together with its full decomposition tree.',
  '🟦',
  'active'
)
ON CONFLICT (headline_goal_id) DO NOTHING;
