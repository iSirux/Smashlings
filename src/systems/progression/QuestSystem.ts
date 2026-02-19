import { QUESTS, QuestDef } from '../../data/quests'
import { eventBus } from '../../core/EventBus'
import type { GameWorld } from '../../world'

export interface QuestProgress {
  questId: string
  current: number
  completed: boolean
}

// Persistent progress (would be saved to localStorage in a full game)
const progress: Map<string, QuestProgress> = new Map()

// Total stats across all runs (persisted)
let totalKills = 0
let totalGold = 0

let listenersAttached = false

export function initQuestSystem(): void {
  // Initialize progress for all quests
  for (const quest of QUESTS) {
    if (!progress.has(quest.id)) {
      progress.set(quest.id, { questId: quest.id, current: 0, completed: false })
    }
  }

  if (listenersAttached) return
  listenersAttached = true

  // Track kills
  eventBus.on('entity:died', (data) => {
    if (data.wasEnemy) {
      totalKills++
      updateKillQuests()
    }
  })

  // Track level ups
  eventBus.on('player:levelup', (data) => {
    updateLevelQuests(data.level)
  })
}

function updateKillQuests(): void {
  for (const quest of QUESTS) {
    if (quest.type !== 'kills') continue
    const p = progress.get(quest.id)!
    if (p.completed) continue
    p.current = totalKills
    if (p.current >= quest.target) {
      p.completed = true
      console.log(`[Quest Complete] ${quest.name} -- Reward: ${quest.reward.gold} gold`)
      totalGold += quest.reward.gold
    }
  }
}

function updateLevelQuests(level: number): void {
  for (const quest of QUESTS) {
    if (quest.type !== 'level') continue
    const p = progress.get(quest.id)!
    if (p.completed) continue
    p.current = Math.max(p.current, level)
    if (p.current >= quest.target) {
      p.completed = true
      console.log(`[Quest Complete] ${quest.name} -- Reward: ${quest.reward.gold} gold`)
      totalGold += quest.reward.gold
    }
  }
}

export function updateSurvivalQuests(timeAlive: number): void {
  for (const quest of QUESTS) {
    if (quest.type !== 'survive') continue
    const p = progress.get(quest.id)!
    if (p.completed) continue
    p.current = Math.max(p.current, Math.floor(timeAlive))
    if (p.current >= quest.target) {
      p.completed = true
      console.log(`[Quest Complete] ${quest.name} -- Reward: ${quest.reward.gold} gold`)
      totalGold += quest.reward.gold
    }
  }
}

export function updateGoldQuests(gold: number): void {
  totalGold = gold
  for (const quest of QUESTS) {
    if (quest.type !== 'gold') continue
    const p = progress.get(quest.id)!
    if (p.completed) continue
    p.current = totalGold
    if (p.current >= quest.target) {
      p.completed = true
      console.log(`[Quest Complete] ${quest.name} -- Reward: ${quest.reward.gold} gold`)
    }
  }
}

export function getQuestProgress(): Array<{ quest: QuestDef; progress: QuestProgress }> {
  return QUESTS.map(q => ({
    quest: q,
    progress: progress.get(q.id) || { questId: q.id, current: 0, completed: false },
  }))
}

export function getCompletedCount(): number {
  let count = 0
  for (const p of progress.values()) {
    if (p.completed) count++
  }
  return count
}

export function getTotalKills(): number { return totalKills }
export function getTotalGold(): number { return totalGold }

/**
 * Quest system ECS entry point.
 * Quests are event-driven so this is a no-op per frame, but the signature
 * matches the standard system contract for easy integration into the loop.
 */
export function questSystem(_world: GameWorld, _dt: number): void {
  // No-op: quests are event-driven via EventBus subscriptions
}
