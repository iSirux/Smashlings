import { defineQuery } from 'bitecs'
import { BoomerangReturn } from '../../components/combat'
import { Transform, Velocity } from '../../components/spatial'
import { IsProjectile } from '../../components/tags'
import type { GameWorld } from '../../world'

const boomerangQuery = defineQuery([IsProjectile, BoomerangReturn, Transform, Velocity])

/**
 * Steers boomerang projectiles along a curved arc toward a target,
 * then homes back to the player in the second half of the flight.
 *
 * Outgoing: velocity blends forward + perpendicular (arc curve).
 * Return:   homing toward the player's current position.
 */
export function boomerangSystem(world: GameWorld, dt: number): void {
  const entities = boomerangQuery(world)
  const playerEid = world.player.eid
  if (playerEid < 0) return

  const playerX = Transform.x[playerEid]
  const playerZ = Transform.z[playerEid]

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]

    BoomerangReturn.elapsed[eid] += dt
    const t = Math.min(BoomerangReturn.elapsed[eid] / BoomerangReturn.totalLife[eid], 1)
    const speed = BoomerangReturn.speed[eid]

    const fwdX = BoomerangReturn.fwdX[eid]
    const fwdZ = BoomerangReturn.fwdZ[eid]
    const perpX = BoomerangReturn.perpX[eid]
    const perpZ = BoomerangReturn.perpZ[eid]

    // Arc: forward component decays via cos, lateral peaks via sin
    const forwardW = Math.cos(t * Math.PI)
    const lateralW = Math.sin(t * Math.PI) * 0.8

    let dx = fwdX * forwardW + perpX * lateralW
    let dz = fwdZ * forwardW + perpZ * lateralW

    // In the return phase, blend in homing toward the player
    if (t > 0.45) {
      const x = Transform.x[eid]
      const z = Transform.z[eid]
      const toPlayerX = playerX - x
      const toPlayerZ = playerZ - z
      const tpDist = Math.sqrt(toPlayerX * toPlayerX + toPlayerZ * toPlayerZ)

      if (tpDist > 0.5) {
        const homeWeight = Math.min((t - 0.45) / 0.55, 1) * 0.7
        dx = dx * (1 - homeWeight) + (toPlayerX / tpDist) * homeWeight
        dz = dz * (1 - homeWeight) + (toPlayerZ / tpDist) * homeWeight
      }
    }

    // Normalize and apply speed
    const len = Math.sqrt(dx * dx + dz * dz)
    if (len > 0.001) {
      Velocity.x[eid] = (dx / len) * speed
      Velocity.z[eid] = (dz / len) * speed
    }
  }
}
