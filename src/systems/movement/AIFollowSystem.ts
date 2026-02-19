import { defineQuery, hasComponent } from 'bitecs'
import { Transform, Velocity, Collider } from '../../components/spatial'
import { AIFollow } from '../../components/movement'
import { EnemyAttack } from '../../components/combat'
import { IsEnemy } from '../../components/tags'
import { sceneManager } from '../../core/SceneManager'
import type { GameWorld } from '../../world'

const aiFollowQuery = defineQuery([AIFollow, Transform, Velocity, IsEnemy])

/** AI behaviors */
const BEHAVIOR_DIRECT = 0
const BEHAVIOR_ORBIT = 1
const BEHAVIOR_KEEP_DISTANCE = 2

/**
 * Steers every AI-follow enemy toward its designated target entity.
 * Branches on AIFollow.behavior:
 *   0 (direct)       — chase straight toward target
 *   1 (orbit)        — orbit around target at preferredDist
 *   2 (keepDistance)  — maintain preferredDist from target
 *
 * Skips enemies that are mid-attack (windup/lunge/cooldown) since
 * the EnemyAttackSystem controls their movement during those phases.
 */
export function aiFollowSystem(world: GameWorld, dt: number): void {
  const entities = aiFollowQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]

    // Skip enemies mid-attack — EnemyAttackSystem owns their velocity
    if (hasComponent(world, EnemyAttack, eid) && EnemyAttack.state[eid] !== 0) {
      // Still snap Y to terrain
      Transform.y[eid] = sceneManager.getTerrainHeight(Transform.x[eid], Transform.z[eid]) + Collider.halfHeight[eid]
      continue
    }

    const targetEid = AIFollow.targetEid[eid]
    const behavior = AIFollow.behavior[eid]

    // Direction from this entity to the target
    const dx = Transform.x[targetEid] - Transform.x[eid]
    const dz = Transform.z[targetEid] - Transform.z[eid]
    const distSq = dx * dx + dz * dz
    const speed = AIFollow.speed[eid]

    // Avoid division by zero when overlapping the target
    if (distSq < 0.0001) {
      Velocity.x[eid] = 0
      Velocity.z[eid] = 0
      Velocity.y[eid] = 0
      Transform.y[eid] = sceneManager.getTerrainHeight(Transform.x[eid], Transform.z[eid]) + Collider.halfHeight[eid]
      continue
    }

    const dist = Math.sqrt(distSq)

    if (behavior === BEHAVIOR_ORBIT) {
      // ── Orbit: circle around target at preferredDist ──────────────
      const preferred = AIFollow.preferredDist[eid]

      // If too far away, fall back to direct chase
      if (dist > preferred * 1.5) {
        Velocity.x[eid] = (dx / dist) * speed
        Velocity.z[eid] = (dz / dist) * speed
      } else {
        // Advance orbit angle
        AIFollow.orbitAngle[eid] += (speed / preferred) * dt

        const angle = AIFollow.orbitAngle[eid]
        const targetX = Transform.x[targetEid] + Math.cos(angle) * preferred
        const targetZ = Transform.z[targetEid] + Math.sin(angle) * preferred

        const toX = targetX - Transform.x[eid]
        const toZ = targetZ - Transform.z[eid]
        const toDist = Math.sqrt(toX * toX + toZ * toZ)

        if (toDist > 0.1) {
          Velocity.x[eid] = (toX / toDist) * speed
          Velocity.z[eid] = (toZ / toDist) * speed
        } else {
          Velocity.x[eid] = 0
          Velocity.z[eid] = 0
        }
      }
    } else if (behavior === BEHAVIOR_KEEP_DISTANCE) {
      // ── Keep Distance: stay at preferredDist ──────────────────────
      const preferred = AIFollow.preferredDist[eid]

      if (dist > preferred + 1) {
        // Too far — chase toward player
        Velocity.x[eid] = (dx / dist) * speed
        Velocity.z[eid] = (dz / dist) * speed
      } else if (dist < preferred - 1) {
        // Too close — flee away from player
        Velocity.x[eid] = -(dx / dist) * speed
        Velocity.z[eid] = -(dz / dist) * speed
      } else {
        // In the sweet spot — stop
        Velocity.x[eid] = 0
        Velocity.z[eid] = 0
      }
    } else {
      // ── Direct: chase straight toward target (default) ────────────
      Velocity.x[eid] = (dx / dist) * speed
      Velocity.z[eid] = (dz / dist) * speed
    }

    Velocity.y[eid] = 0

    // Snap Y to terrain
    Transform.y[eid] = sceneManager.getTerrainHeight(Transform.x[eid], Transform.z[eid]) + Collider.halfHeight[eid]

    // Face movement direction (toward target for all behaviors)
    Transform.rotY[eid] = Math.atan2(dx, dz)
  }
}
