import { createWorld, IWorld } from 'bitecs'
import { INITIAL_WEAPON_SLOTS, INITIAL_TOME_SLOTS } from './data/balance'
import type { DifficultyTier } from './data/difficulty'
import { DIFFICULTY_TIERS } from './data/difficulty'

export interface WeaponSlotData {
  eid: number
  weaponKey: string
  level: number
}

export interface TomeSlotData {
  id: string
  level: number
}

export interface GameWorld extends IWorld {
  time: {
    /** Total elapsed game time in seconds (paused time excluded). */
    elapsed: number
    /** Fixed timestep delta in seconds (1/60). */
    delta: number
    /** Countdown timer in seconds. Starts at 600 (10 minutes). */
    gameTimer: number
  }
  player: {
    /** Entity id of the player, -1 when not yet spawned. */
    eid: number
    level: number
    xp: number
    xpToNext: number
    kills: number
    gold: number
    /** Selected character id. */
    characterId: string
    /** Active weapon key (e.g. 'sword'). */
    weaponId: string
    /** Weapon slots (null = empty). */
    weaponSlots: Array<WeaponSlotData | null>
    /** Tome slots (null = empty). */
    tomeSlots: Array<TomeSlotData | null>
    maxWeaponSlots: number
    maxTomeSlots: number
  }
  /** Items collected during the current run (item ids). */
  items: string[]
  paused: boolean
  /** Selected difficulty tier. */
  difficulty: DifficultyTier
  /** Selected map id ('forest' | 'desert'). */
  mapId: string
}

/**
 * Create and return a fresh GameWorld with sane defaults.
 */
export function createGameWorld(): GameWorld {
  const base = createWorld()

  const world = base as GameWorld

  world.time = {
    elapsed: 0,
    delta: 1 / 60,
    gameTimer: 600, // 10 minutes
  }

  world.player = {
    eid: -1,
    level: 1,
    xp: 0,
    xpToNext: 10,
    kills: 0,
    gold: 0,
    characterId: 'knight',
    weaponId: 'sword',
    weaponSlots: new Array(INITIAL_WEAPON_SLOTS).fill(null),
    tomeSlots: new Array(INITIAL_TOME_SLOTS).fill(null),
    maxWeaponSlots: INITIAL_WEAPON_SLOTS,
    maxTomeSlots: INITIAL_TOME_SLOTS,
  }

  world.items = []
  world.paused = false
  world.difficulty = DIFFICULTY_TIERS[0] // Normal
  world.mapId = 'forest'

  return world
}
