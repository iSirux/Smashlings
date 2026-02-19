import { defineQuery, hasComponent } from 'bitecs'
import { IsEnemy, IsPlayer, DestroyFlag } from '../../components/tags'
import { EnemyRangedAttack } from '../../components/combat'
import { Transform } from '../../components/spatial'
import { distanceSq } from '../../utils/math'
import {
  createEnemyProjectile,
  createEnemyHomingProjectile,
  createPoisonCloud,
} from '../../prefabs/enemyProjectiles'
import type { GameWorld } from '../../world'

const rangedQuery = defineQuery([IsEnemy, EnemyRangedAttack, Transform])
const playerQuery = defineQuery([IsPlayer, Transform])

/**
 * Ticks ranged attack cooldowns for enemies with EnemyRangedAttack.
 * Fires projectiles based on projectileType when cooldown expires.
 */
export function enemyRangedAttackSystem(world: GameWorld, dt: number): void {
  const enemies = rangedQuery(world)
  const players = playerQuery(world)
  if (players.length === 0) return

  const playerId = players[0]
  const plx = Transform.x[playerId]
  const plz = Transform.z[playerId]

  for (let i = 0; i < enemies.length; i++) {
    const eid = enemies[i]
    if (hasComponent(world, DestroyFlag, eid)) continue

    // Tick cooldown
    EnemyRangedAttack.cooldownTimer[eid] -= dt
    if (EnemyRangedAttack.cooldownTimer[eid] > 0) continue

    // Reset cooldown
    EnemyRangedAttack.cooldownTimer[eid] = EnemyRangedAttack.cooldown[eid]

    const ex = Transform.x[eid]
    const ey = Transform.y[eid]
    const ez = Transform.z[eid]

    // Check min range — only fire if player is far enough away
    const minRange = EnemyRangedAttack.minRange[eid]
    if (minRange > 0) {
      const dSq = distanceSq(ex, ez, plx, plz)
      if (dSq < minRange * minRange) continue
    }

    // Direction to player
    const dx = plx - ex
    const dz = plz - ez
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < 0.001) continue

    const dirX = dx / dist
    const dirZ = dz / dist
    const damage = EnemyRangedAttack.damage[eid]
    const speed = EnemyRangedAttack.projectileSpeed[eid]
    const projType = EnemyRangedAttack.projectileType[eid]

    switch (projType) {
      case 0: // straight
        createEnemyProjectile(world, ex, ey + 0.5, ez, dirX, dirZ, damage, speed)
        break
      case 1: // homing
        createEnemyHomingProjectile(world, ex, ey + 0.5, ez, dirX, dirZ, damage, speed)
        break
      case 2: // aoe_cloud — spawn at player's position
        createPoisonCloud(world, plx, Transform.y[playerId] + 0.2, plz, damage)
        break
    }
  }
}
