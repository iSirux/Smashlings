import { defineQuery } from 'bitecs'
import { Transform, Velocity } from '../../components/spatial'
import type { GameWorld } from '../../world'

const movementQuery = defineQuery([Transform, Velocity])

/**
 * Integrates velocity into position for ALL entities that have both
 * Transform and Velocity (players, enemies, projectiles, pickups, etc.).
 */
export function movementSystem(world: GameWorld, dt: number): void {
  const entities = movementQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    Transform.x[eid] += Velocity.x[eid] * dt
    Transform.y[eid] += Velocity.y[eid] * dt
    Transform.z[eid] += Velocity.z[eid] * dt
  }
}
