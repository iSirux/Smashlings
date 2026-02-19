import { createWorld, IWorld } from 'bitecs'

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
    /** Current weapon id. */
    weaponId: string
  }
  /** Items collected during the current run (item ids). */
  items: string[]
  paused: boolean
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
  }

  world.items = []
  world.paused = false

  return world
}
