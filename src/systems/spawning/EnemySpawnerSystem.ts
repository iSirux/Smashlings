import { defineQuery } from 'bitecs'
import { IsEnemy } from '../../components/tags'
import { Transform } from '../../components/spatial'
import { IsPlayer } from '../../components/tags'
import { createEnemy } from '../../prefabs/enemies'
import { ENEMIES } from '../../data/enemies'
import { eventBus } from '../../core/EventBus'
import {
  BASE_SPAWN_INTERVAL,
  MIN_SPAWN_INTERVAL,
  SPAWN_RADIUS,
  MAX_ENEMIES,
} from '../../data/balance'
import type { GameWorld } from '../../world'

const enemyQuery = defineQuery([IsEnemy])
const playerQuery = defineQuery([IsPlayer, Transform])

/**
 * Seconds of game time before brutes and wolves (indices 1, 3) unlock.
 * Before this threshold only goblins (0) and bats (2) may spawn.
 */
const ALL_ENEMIES_UNLOCK_TIME = 300 // 5 minutes

/** Indices of enemies available from the start. */
const EARLY_ENEMY_INDICES = [0, 2] // goblin, bat

/** Module-level spawn timer. Accumulates dt between spawn ticks. */
let spawnTimer = 0

/**
 * Reset internal state (call when restarting a game session).
 */
export function resetSpawner(): void {
  spawnTimer = 0
}

/**
 * Spawns waves of enemies around the player. Spawn rate and batch size
 * increase as game time progresses.
 */
export function enemySpawnerSystem(world: GameWorld, dt: number): void {
  const elapsed = world.time.elapsed

  // Spawn interval decreases over time: starts at BASE and decays toward MIN
  // Difficulty multiplier: higher spawnRateMult = more enemies = shorter intervals
  const diffSpawnMult = world.difficulty.spawnRateMult
  const decayFactor = 1 - Math.min(elapsed / 600, 0.8) // over 10 min, reduce to 20% of base
  const spawnInterval = Math.max(
    MIN_SPAWN_INTERVAL,
    (BASE_SPAWN_INTERVAL / diffSpawnMult) * decayFactor,
  )

  spawnTimer += dt

  if (spawnTimer < spawnInterval) return
  spawnTimer -= spawnInterval

  // Count current enemies
  const currentEnemies = enemyQuery(world)
  if (currentEnemies.length >= MAX_ENEMIES) return

  // Get player position for spawn placement
  const players = playerQuery(world)
  if (players.length === 0) return
  const playerId = players[0]
  const playerX = Transform.x[playerId]
  const playerZ = Transform.z[playerId]

  // Batch size increases over time: 1 at start, up to ~8 by 10 minutes
  const batchSize = Math.min(
    8,
    Math.floor(1 + elapsed / 75),
  )

  // Determine which enemy indices are available based on elapsed time
  const availableIndices = elapsed >= ALL_ENEMIES_UNLOCK_TIME
    ? ENEMIES.map((_e, i) => i) // all enemies
    : EARLY_ENEMY_INDICES

  // Build weighted pool for available enemies
  let totalWeight = 0
  for (let i = 0; i < availableIndices.length; i++) {
    totalWeight += ENEMIES[availableIndices[i]].spawnWeight
  }

  // Spawn a batch
  const spawnCount = Math.min(batchSize, MAX_ENEMIES - currentEnemies.length)
  for (let s = 0; s < spawnCount; s++) {
    // Pick a random enemy type via weighted selection
    let roll = Math.random() * totalWeight
    let chosenIndex = availableIndices[0]
    for (let i = 0; i < availableIndices.length; i++) {
      roll -= ENEMIES[availableIndices[i]].spawnWeight
      if (roll <= 0) {
        chosenIndex = availableIndices[i]
        break
      }
    }

    // Random position on circle around player
    const angle = Math.random() * Math.PI * 2
    const x = playerX + Math.cos(angle) * SPAWN_RADIUS
    const z = playerZ + Math.sin(angle) * SPAWN_RADIUS

    const eid = createEnemy(world, chosenIndex, x, z)

    eventBus.emit('enemy:spawned', { eid })
  }
}
