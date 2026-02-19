import { defineQuery } from 'bitecs'
import { Transform, Collider } from '../../components/spatial'
import { IsPlayer, IsEnemy } from '../../components/tags'
import { Interactable } from '../../components/upgrades'
import type { GameWorld } from '../../world'

const playerQuery = defineQuery([IsPlayer, Collider, Transform])
const enemyQuery = defineQuery([IsEnemy, Collider, Transform])
const interactableQuery = defineQuery([Interactable, Collider, Transform])

/**
 * Resolves solid-body collisions between entities on the XZ plane.
 * - Player vs Enemies: both pushed apart (30% player, 70% enemy)
 * - Player vs World Objects (shrines, chests): player pushed out entirely
 */
export function entityCollisionSystem(world: GameWorld, _dt: number): void {
  const players = playerQuery(world)
  if (players.length === 0) return

  const pid = players[0]
  const px = Transform.x[pid]
  const pz = Transform.z[pid]
  const pRadius = Collider.radius[pid]

  // Accumulate total push on the player across all collisions
  let pushX = 0
  let pushZ = 0

  // ── Player vs Enemies ──────────────────────────────────────────────
  const enemies = enemyQuery(world)
  for (let i = 0; i < enemies.length; i++) {
    const eid = enemies[i]
    const ex = Transform.x[eid]
    const ez = Transform.z[eid]
    const eRadius = Collider.radius[eid]

    const dx = px - ex
    const dz = pz - ez
    const distSq = dx * dx + dz * dz
    const minDist = pRadius + eRadius

    if (distSq >= minDist * minDist || distSq < 0.0001) continue

    const dist = Math.sqrt(distSq)
    const overlap = minDist - dist
    const nx = dx / dist
    const nz = dz / dist

    // Push player 30%, enemy 70%
    pushX += nx * overlap * 0.3
    pushZ += nz * overlap * 0.3
    Transform.x[eid] -= nx * overlap * 0.7
    Transform.z[eid] -= nz * overlap * 0.7
  }

  // ── Player vs World Objects (static) ────────────────────────────────
  const interactables = interactableQuery(world)
  for (let i = 0; i < interactables.length; i++) {
    const eid = interactables[i]
    const ox = Transform.x[eid]
    const oz = Transform.z[eid]
    const oRadius = Collider.radius[eid]

    const dx = px + pushX - ox
    const dz = pz + pushZ - oz
    const distSq = dx * dx + dz * dz
    const minDist = pRadius + oRadius

    if (distSq >= minDist * minDist || distSq < 0.0001) continue

    const dist = Math.sqrt(distSq)
    const overlap = minDist - dist
    const nx = dx / dist
    const nz = dz / dist

    // Push player out entirely (objects are static)
    pushX += nx * overlap
    pushZ += nz * overlap
  }

  // Apply accumulated push to player
  Transform.x[pid] += pushX
  Transform.z[pid] += pushZ
}
