export interface DifficultyTier {
  id: number
  name: string
  stages: number
  enemyHpMult: number
  enemyDmgMult: number
  enemySpeedMult: number
  spawnRateMult: number
  xpMult: number
  goldMult: number
  unlockCondition?: string
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  {
    id: 1, name: 'Normal', stages: 1,
    enemyHpMult: 1.0, enemyDmgMult: 1.0, enemySpeedMult: 1.0,
    spawnRateMult: 1.0, xpMult: 1.0, goldMult: 1.0,
  },
  {
    id: 2, name: 'Hard', stages: 2,
    enemyHpMult: 1.5, enemyDmgMult: 1.3, enemySpeedMult: 1.1,
    spawnRateMult: 1.3, xpMult: 1.2, goldMult: 1.5,
    unlockCondition: 'Clear Tier 1',
  },
  {
    id: 3, name: 'Very Hard', stages: 3,
    enemyHpMult: 2.5, enemyDmgMult: 1.8, enemySpeedMult: 1.2,
    spawnRateMult: 1.6, xpMult: 1.5, goldMult: 2.0,
    unlockCondition: 'Clear Tier 2',
  },
]
