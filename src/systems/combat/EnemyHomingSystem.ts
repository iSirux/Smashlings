import { defineQuery, hasComponent } from 'bitecs'
import { IsEnemyProjectile, IsPlayer, DestroyFlag } from '../../components/tags'
import { EnemyHoming } from '../../components/combat'
import { Transform, Velocity } from '../../components/spatial'
import type { GameWorld } from '../../world'

const homingQuery = defineQuery([IsEnemyProjectile, EnemyHoming, Transform, Velocity])
const playerQuery = defineQuery([IsPlayer, Transform])

/**
 * Gently steers homing enemy projectiles toward the player.
 * Turn rate is capped so projectiles remain dodgeable.
 */
export function enemyHomingSystem(world: GameWorld, dt: number): void {
  const projs = homingQuery(world)
  const players = playerQuery(world)
  if (players.length === 0) return

  const playerId = players[0]
  const plx = Transform.x[playerId]
  const plz = Transform.z[playerId]

  for (let i = 0; i < projs.length; i++) {
    const eid = projs[i]
    if (hasComponent(world, DestroyFlag, eid)) continue

    const px = Transform.x[eid]
    const pz = Transform.z[eid]
    const vx = Velocity.x[eid]
    const vz = Velocity.z[eid]

    // Current speed
    const speed = Math.sqrt(vx * vx + vz * vz)
    if (speed < 0.001) continue

    // Current heading angle
    const currentAngle = Math.atan2(vz, vx)

    // Desired heading angle toward player
    const dx = plx - px
    const dz = plz - pz
    const desiredAngle = Math.atan2(dz, dx)

    // Angular difference, wrapped to [-PI, PI]
    let angleDiff = desiredAngle - currentAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2

    // Apply turn rate limit
    const turnRate = EnemyHoming.turnRate[eid]
    const maxTurn = turnRate * dt
    const turn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff))

    const newAngle = currentAngle + turn
    Velocity.x[eid] = Math.cos(newAngle) * speed
    Velocity.z[eid] = Math.sin(newAngle) * speed
  }
}
