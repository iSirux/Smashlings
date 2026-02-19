import { hasComponent, addComponent } from 'bitecs'
import { Transform } from '../../components/spatial'
import { IsBoss, DestroyFlag } from '../../components/tags'
import { distanceSq } from '../../utils/math'
import { SPAWN_RADIUS } from '../../data/balance'
import { ENEMY_INDEX } from '../../data/enemies'
import { createEnemy } from '../../prefabs/enemies'
import { createBossPortal, getPortalEid, resetPortal } from '../../prefabs/props'
import { eventBus } from '../../core/EventBus'
import { startFinalSwarm } from './FinalSwarmSystem'
import type { GameWorld } from '../../world'

// ── Module-level spawn flags ────────────────────────────────────────────────
let miniBoss1Spawned = false
let miniBoss2Spawned = false
let portalSpawned = false
let bossSpawned = false
let bossDefeated = false
let bossEid = -1
let listenerRegistered = false

/** Portal activation radius squared (3 units). */
const PORTAL_RADIUS_SQ = 3 * 3

/**
 * Registers an event listener for boss death tracking.
 * Only registers once per session.
 */
function ensureListener(): void {
  if (listenerRegistered) return
  listenerRegistered = true

  eventBus.on('entity:died', (data) => {
    if (data.eid === bossEid && data.wasEnemy) {
      bossDefeated = true
      bossEid = -1
    }
  })
}

/**
 * Spawn a position at SPAWN_RADIUS distance from the player at a random angle.
 */
function spawnPositionNearPlayer(world: GameWorld): { x: number; z: number } {
  const angle = Math.random() * Math.PI * 2
  const px = Transform.x[world.player.eid]
  const pz = Transform.z[world.player.eid]
  return {
    x: px + Math.cos(angle) * SPAWN_RADIUS,
    z: pz + Math.sin(angle) * SPAWN_RADIUS,
  }
}

/**
 * Boss spawn system. Manages mini-boss, boss portal, and boss spawning
 * on a timeline based on elapsed game time.
 *
 * Timeline (10-minute game, so elapsed thresholds):
 * - 2:00 elapsed (8:00 remaining): first mini-boss
 * - 3:00 elapsed (7:00 remaining): second mini-boss
 * - 5:00 elapsed (5:00 remaining): boss portal appears
 * - Portal proximity: boss spawns when player approaches portal
 * - Boss death: triggers Final Swarm
 */
export function bossSpawnSystem(world: GameWorld, dt: number): void {
  ensureListener()

  const elapsed = world.time.elapsed

  // ── Mini-boss 1 at 2:00 elapsed ──────────────────────────────────────
  if (!miniBoss1Spawned && elapsed >= 120) {
    miniBoss1Spawned = true
    const pos = spawnPositionNearPlayer(world)
    const idx = ENEMY_INDEX['stone_golem']
    if (idx !== undefined) {
      createEnemy(world, idx, pos.x, pos.z)
    }
  }

  // ── Mini-boss 2 at 3:00 elapsed ──────────────────────────────────────
  if (!miniBoss2Spawned && elapsed >= 180) {
    miniBoss2Spawned = true
    const pos = spawnPositionNearPlayer(world)
    const idx = ENEMY_INDEX['chunkham']
    if (idx !== undefined) {
      createEnemy(world, idx, pos.x, pos.z)
    }
  }

  // ── Boss portal at 5:00 elapsed ──────────────────────────────────────
  if (!portalSpawned && elapsed >= 300) {
    portalSpawned = true
    const pos = spawnPositionNearPlayer(world)
    createBossPortal(world, pos.x, pos.z)
  }

  // ── Check portal proximity for boss spawn ────────────────────────────
  if (portalSpawned && !bossSpawned) {
    const portalId = getPortalEid()
    if (portalId >= 0 && !hasComponent(world, DestroyFlag, portalId)) {
      const px = Transform.x[world.player.eid]
      const pz = Transform.z[world.player.eid]
      const portalX = Transform.x[portalId]
      const portalZ = Transform.z[portalId]

      const dSq = distanceSq(px, pz, portalX, portalZ)
      if (dSq < PORTAL_RADIUS_SQ) {
        bossSpawned = true

        // Remove the portal
        addComponent(world, DestroyFlag, portalId)
        resetPortal()

        // Spawn the boss at the portal location
        const idx = ENEMY_INDEX['lil_bark']
        if (idx !== undefined) {
          bossEid = createEnemy(world, idx, portalX, portalZ)
        }
      }
    }
  }

  // ── Boss defeated → start Final Swarm ────────────────────────────────
  if (bossSpawned && bossDefeated) {
    // Only trigger once
    bossDefeated = false // prevent re-triggering
    startFinalSwarm()
  }
}

/**
 * Reset all boss spawn state. Call when restarting the game.
 */
export function resetBossSpawn(): void {
  miniBoss1Spawned = false
  miniBoss2Spawned = false
  portalSpawned = false
  bossSpawned = false
  bossDefeated = false
  bossEid = -1
  resetPortal()
}
