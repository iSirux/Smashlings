import { defineQuery } from 'bitecs'
import { Transform, Velocity, Collider } from '../../components/spatial'
import { AIFollow } from '../../components/movement'
import { IsEnemy } from '../../components/tags'
import { sceneManager } from '../../core/SceneManager'
import type { GameWorld } from '../../world'

const aiFollowQuery = defineQuery([AIFollow, Transform, Velocity, IsEnemy])

/**
 * Steers every AI-follow enemy toward its designated target entity.
 * Sets horizontal velocity toward the target and rotates to face it.
 * Enemies do not jump -- Velocity.y is always set to 0.
 */
export function aiFollowSystem(world: GameWorld, dt: number): void {
  const entities = aiFollowQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    const targetEid = AIFollow.targetEid[eid]

    // Direction from this entity to the target
    const dx = Transform.x[targetEid] - Transform.x[eid]
    const dz = Transform.z[targetEid] - Transform.z[eid]

    const distSq = dx * dx + dz * dz

    // Avoid division by zero when overlapping the target
    if (distSq < 0.0001) {
      Velocity.x[eid] = 0
      Velocity.z[eid] = 0
      Velocity.y[eid] = 0
      Transform.y[eid] = sceneManager.getTerrainHeight(Transform.x[eid], Transform.z[eid]) + Collider.halfHeight[eid]
      continue
    }

    const dist = Math.sqrt(distSq)
    const speed = AIFollow.speed[eid]

    // Normalise direction and scale by speed
    Velocity.x[eid] = (dx / dist) * speed
    Velocity.z[eid] = (dz / dist) * speed
    Velocity.y[eid] = 0

    // Snap Y to terrain
    Transform.y[eid] = sceneManager.getTerrainHeight(Transform.x[eid], Transform.z[eid]) + Collider.halfHeight[eid]

    // Face movement direction
    Transform.rotY[eid] = Math.atan2(dx, dz)
  }
}
