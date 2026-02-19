import { defineQuery, hasComponent, addComponent } from 'bitecs'
import { IsProjectile, IsEnemy, IsPlayer, DestroyFlag } from '../../components/tags'
import { DamageOnContact, Health, Invincible } from '../../components/combat'
import { Transform, Velocity } from '../../components/spatial'
import { distanceSq } from '../../utils/math'
import { eventBus } from '../../core/EventBus'
import {
  PLAYER_INVINCIBILITY_TIME,
} from '../../data/balance'
import type { GameWorld } from '../../world'

const projectileQuery = defineQuery([IsProjectile, DamageOnContact, Transform])
const enemyQuery = defineQuery([IsEnemy, Health, Transform])
const playerQuery = defineQuery([IsPlayer, Health, Transform])

/** Squared collision radius for projectile vs enemy hits. */
const PROJECTILE_HIT_RADIUS = 1.5
const PROJECTILE_HIT_SQ = PROJECTILE_HIT_RADIUS * PROJECTILE_HIT_RADIUS

/** Squared collision radius for enemy vs player contact. */
const ENEMY_CONTACT_RADIUS = 1.2
const ENEMY_CONTACT_SQ = ENEMY_CONTACT_RADIUS * ENEMY_CONTACT_RADIUS

/**
 * Handles projectile-vs-enemy and enemy-vs-player contact damage.
 * Applies armor reduction, knockback, invincibility frames, and cleanup.
 */
export function damageSystem(world: GameWorld, dt: number): void {
  const projectiles = projectileQuery(world)
  const enemies = enemyQuery(world)
  const players = playerQuery(world)

  // ---- Projectile vs Enemy ----
  for (let p = 0; p < projectiles.length; p++) {
    const pid = projectiles[p]

    // Skip already-destroyed projectiles
    if (hasComponent(world, DestroyFlag, pid)) continue

    const px = Transform.x[pid]
    const pz = Transform.z[pid]

    for (let e = 0; e < enemies.length; e++) {
      const eid = enemies[e]

      // Skip dead enemies
      if (hasComponent(world, DestroyFlag, eid)) continue

      const ex = Transform.x[eid]
      const ez = Transform.z[eid]

      const dSq = distanceSq(px, pz, ex, ez)

      if (dSq < PROJECTILE_HIT_SQ) {
        // Calculate armor reduction: reduction = armor / (armor + 100)
        const armor = Health.armor[eid]
        const reduction = armor / (armor + 100)
        const rawDamage = DamageOnContact.amount[pid]
        const finalDamage = rawDamage * (1 - reduction)

        Health.current[eid] -= finalDamage

        // Knockback: push enemy away from projectile source
        const knockbackForce = DamageOnContact.knockback[pid]
        if (knockbackForce > 0 && dSq > 0.0001) {
          const dx = ex - px
          const dz2 = ez - pz
          const dist = Math.sqrt(dSq)
          const nx = dx / dist
          const nz = dz2 / dist

          Velocity.x[eid] += nx * knockbackForce
          Velocity.z[eid] += nz * knockbackForce
        }

        eventBus.emit('entity:damaged', {
          eid,
          amount: finalDamage,
          x: ex,
          y: Transform.y[eid],
          z: ez,
          isCrit: false,
        })

        // Track pierce
        DamageOnContact.hitCount[pid]++
        if (DamageOnContact.hitCount[pid] >= DamageOnContact.pierce[pid]) {
          addComponent(world, DestroyFlag, pid)
          break // This projectile is done
        }
      }
    }
  }

  // ---- Enemy vs Player (contact damage) ----
  if (players.length === 0) return

  const playerId = players[0]

  // Skip if player is invincible
  if (hasComponent(world, Invincible, playerId)) return

  const plx = Transform.x[playerId]
  const plz = Transform.z[playerId]

  for (let e = 0; e < enemies.length; e++) {
    const eid = enemies[e]

    if (hasComponent(world, DestroyFlag, eid)) continue
    if (!hasComponent(world, DamageOnContact, eid)) continue

    const ex = Transform.x[eid]
    const ez = Transform.z[eid]

    const dSq = distanceSq(plx, plz, ex, ez)

    if (dSq < ENEMY_CONTACT_SQ) {
      const armor = Health.armor[playerId]
      const reduction = armor / (armor + 100)
      const rawDamage = DamageOnContact.amount[eid]
      const finalDamage = rawDamage * (1 - reduction)

      Health.current[playerId] -= finalDamage

      // Grant invincibility frames
      addComponent(world, Invincible, playerId)
      Invincible.timer[playerId] = PLAYER_INVINCIBILITY_TIME

      eventBus.emit('entity:damaged', {
        eid: playerId,
        amount: finalDamage,
        x: plx,
        y: Transform.y[playerId],
        z: plz,
        isCrit: false,
      })

      // Only one enemy can deal contact damage per frame (i-frames kick in)
      break
    }
  }
}
