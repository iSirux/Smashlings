import { Transform } from '../../components/spatial'
import { Health } from '../../components/combat'
import { SPAWN_RADIUS } from '../../data/balance'
import { ENEMY_INDEX } from '../../data/enemies'
import { createEnemy } from '../../prefabs/enemies'
import type { GameWorld } from '../../world'

// ── Module-level state ──────────────────────────────────────────────────────
let active = false
let swarmTimer = 0
let swarmElapsed = 0

/** Duration in seconds before "super ghosts" start spawning. */
const SUPER_GHOST_THRESHOLD = 360 // 6 minutes

/** Starting spawn interval in seconds. */
const INITIAL_INTERVAL = 0.5

/** Minimum spawn interval in seconds. */
const MIN_INTERVAL = 0.1

/** How long (in seconds) it takes to ramp from INITIAL_INTERVAL to MIN_INTERVAL. */
const RAMP_DURATION = 360 // 6 minutes

/**
 * Activate the Final Swarm. Called after the boss is defeated.
 */
export function startFinalSwarm(): void {
  active = true
  swarmTimer = 0
  swarmElapsed = 0
}

/**
 * Reset the Final Swarm state. Call when restarting the game.
 */
export function resetFinalSwarm(): void {
  active = false
  swarmTimer = 0
  swarmElapsed = 0
}

/**
 * Final Swarm system. After the boss is defeated, rapidly spawns waves of
 * ghost enemies with increasing intensity.
 *
 * - Spawn interval starts at 0.5s and ramps down to 0.1s over 6 minutes
 * - After 6 minutes, spawns "super ghosts" with 3x health
 */
export function finalSwarmSystem(world: GameWorld, dt: number): void {
  if (!active) return

  swarmElapsed += dt
  swarmTimer += dt

  // Calculate current spawn interval (linear ramp from INITIAL to MIN)
  const rampT = Math.min(swarmElapsed / RAMP_DURATION, 1)
  const currentInterval = INITIAL_INTERVAL + (MIN_INTERVAL - INITIAL_INTERVAL) * rampT

  if (swarmTimer < currentInterval) return
  swarmTimer -= currentInterval

  const ghostIdx = ENEMY_INDEX['ghost']
  if (ghostIdx === undefined) return

  // Spawn at random angle around the player
  const angle = Math.random() * Math.PI * 2
  const px = Transform.x[world.player.eid]
  const pz = Transform.z[world.player.eid]
  const x = px + Math.cos(angle) * SPAWN_RADIUS
  const z = pz + Math.sin(angle) * SPAWN_RADIUS

  const eid = createEnemy(world, ghostIdx, x, z)

  // After 6 minutes of swarm, create "super ghosts" with 3x health
  if (swarmElapsed >= SUPER_GHOST_THRESHOLD) {
    Health.current[eid] *= 3
    Health.max[eid] *= 3
  }
}
