import { defineQuery, hasComponent, addComponent } from 'bitecs'
import { IsProjectile, IsEnemy, IsPlayer, IsBoss, IsEnemyProjectile, DestroyFlag } from '../../components/tags'
import { DamageOnContact, Health, Invincible, ChainLightning, EnemyAttack } from '../../components/combat'
import { PlayerStats } from '../../components/stats'
import { PlayerControlled } from '../../components/movement'
import { Transform, Velocity } from '../../components/spatial'
import { distanceSq } from '../../utils/math'
import { eventBus } from '../../core/EventBus'
import { createLightningBolt } from '../../prefabs/projectiles'
import {
  PLAYER_INVINCIBILITY_TIME,
} from '../../data/balance'
import type { GameWorld } from '../../world'

const projectileQuery = defineQuery([IsProjectile, DamageOnContact, Transform])
const enemyProjectileQuery = defineQuery([IsEnemyProjectile, DamageOnContact, Transform])
const enemyQuery = defineQuery([IsEnemy, Health, Transform])
const playerQuery = defineQuery([IsPlayer, Health, Transform])

/** Squared collision radius for projectile vs enemy hits. */
const PROJECTILE_HIT_RADIUS = 1.5
const PROJECTILE_HIT_SQ = PROJECTILE_HIT_RADIUS * PROJECTILE_HIT_RADIUS

/** Squared collision radius for enemy vs player contact. */
const ENEMY_CONTACT_RADIUS = 1.2
const ENEMY_CONTACT_SQ = ENEMY_CONTACT_RADIUS * ENEMY_CONTACT_RADIUS

/** Squared collision radius for enemy projectile vs player. */
const ENEMY_PROJ_HIT_RADIUS = 1.0
const ENEMY_PROJ_HIT_SQ = ENEMY_PROJ_HIT_RADIUS * ENEMY_PROJ_HIT_RADIUS

/**
 * Handles projectile-vs-enemy, enemy-vs-player contact, and enemy-projectile-vs-player damage.
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
        let rawDamage = DamageOnContact.amount[pid]

        // Apply player damage multiplier from PlayerStats
        const playerEid = world.player.eid
        const hasStats = playerEid >= 0 && hasComponent(world, PlayerStats, playerEid)
        const damageMult = hasStats ? PlayerStats.damageMult[playerEid] : 1.0
        rawDamage *= (damageMult > 0 ? damageMult : 1.0)

        // Boss damage bonus
        if (hasStats && hasComponent(world, IsBoss, eid)) {
          const bossMult = PlayerStats.bossDamageMult[playerEid]
          if (bossMult > 0) rawDamage *= (1 + bossMult)
        }

        // Idle damage bonus (player standing still)
        if (hasStats) {
          const idleMult = PlayerStats.idleDamageMult[playerEid]
          if (idleMult > 0) {
            const vx = Velocity.x[playerEid]
            const vz = Velocity.z[playerEid]
            if (vx * vx + vz * vz < 0.01) {
              rawDamage *= (1 + idleMult)
            }
          }
        }

        // Speed Demon passive: damage scales with move speed
        if (hasStats) {
          const speedDmg = PlayerStats.speedDamageMult[playerEid]
          if (speedDmg > 0) {
            const baseSpeed = hasComponent(world, PlayerControlled, playerEid)
              ? PlayerControlled.moveSpeed[playerEid] : 6
            rawDamage *= (1 + speedDmg * baseSpeed * 0.1)
          }
        }

        // Roll for crit
        let isCrit = false
        if (hasStats) {
          const critChance = PlayerStats.critChance[playerEid]
          if (critChance > 0 && Math.random() < critChance) {
            isCrit = true
            const critDamage = PlayerStats.critDamage[playerEid]
            rawDamage *= (critDamage > 0 ? critDamage : 2.0)
          }
        }

        const finalDamage = rawDamage * (1 - reduction)

        Health.current[eid] -= finalDamage

        // Lifesteal: heal player by damage * lifesteal
        if (hasStats) {
          const lifesteal = PlayerStats.lifesteal[playerEid]
          if (lifesteal > 0) {
            Health.current[playerEid] = Math.min(
              Health.max[playerEid],
              Health.current[playerEid] + finalDamage * lifesteal,
            )
          }
        }

        // Knockback: push enemy away from projectile source
        let knockbackForce = DamageOnContact.knockback[pid]
        if (hasStats) {
          const knockbackMult = PlayerStats.knockbackMult[playerEid]
          if (knockbackMult > 0) {
            knockbackForce *= knockbackMult
          }
        }
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
          isCrit,
        })

        // Chain lightning: spawn a bolt toward the nearest other enemy
        if (hasComponent(world, ChainLightning, pid) && ChainLightning.chainsRemaining[pid] > 0) {
          const chainRange = ChainLightning.chainRange[pid]
          const chainRangeSq = chainRange * chainRange
          const chains = ChainLightning.chainsRemaining[pid] - 1

          let bestChainSq = chainRangeSq
          let chainTarget = -1
          for (let c = 0; c < enemies.length; c++) {
            const ceid = enemies[c]
            if (ceid === eid) continue // skip the enemy we just hit
            if (hasComponent(world, DestroyFlag, ceid)) continue
            const cdSq = distanceSq(ex, ez, Transform.x[ceid], Transform.z[ceid])
            if (cdSq < bestChainSq) {
              bestChainSq = cdSq
              chainTarget = ceid
            }
          }

          if (chainTarget !== -1) {
            const tx = Transform.x[chainTarget]
            const tz = Transform.z[chainTarget]
            const cdx = tx - ex
            const cdz = tz - ez
            const cdist = Math.sqrt(cdx * cdx + cdz * cdz)
            if (cdist > 0.001) {
              createLightningBolt(world, ex, Transform.y[eid] + 0.5, ez, cdx / cdist, cdz / cdist,
                DamageOnContact.amount[pid], DamageOnContact.knockback[pid], chains)
            }
          }
        }

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

  // Skip if player is invincible (applies to both contact and enemy projectiles)
  const playerInvincible = hasComponent(world, Invincible, playerId)

  const playerHasStats = hasComponent(world, PlayerStats, playerId)

  const plx = Transform.x[playerId]
  const ply = Transform.y[playerId]
  const plz = Transform.z[playerId]

  // Update Flex timer (Aura Chad passive: ignore damage if not hit recently)
  if (playerHasStats && PlayerStats.flexTimer[playerId] > 0) {
    PlayerStats.flexTimer[playerId] += dt
  }

  // ---- Enemy Projectile vs Player ----
  if (!playerInvincible) {
    const enemyProjs = enemyProjectileQuery(world)

    for (let p = 0; p < enemyProjs.length; p++) {
      const pid = enemyProjs[p]
      if (hasComponent(world, DestroyFlag, pid)) continue

      const px = Transform.x[pid]
      const pz = Transform.z[pid]

      const dSq = distanceSq(plx, plz, px, pz)

      if (dSq < ENEMY_PROJ_HIT_SQ) {
        // Check evasion
        if (playerHasStats) {
          const evasion = PlayerStats.evasion[playerId]
          if (evasion > 0 && Math.random() < evasion) {
            addComponent(world, Invincible, playerId)
            Invincible.timer[playerId] = PLAYER_INVINCIBILITY_TIME
            addComponent(world, DestroyFlag, pid)
            break
          }
        }

        // Flex passive
        if (playerHasStats && PlayerStats.flexTimer[playerId] >= 3.0) {
          PlayerStats.flexTimer[playerId] = 0.001
          addComponent(world, Invincible, playerId)
          Invincible.timer[playerId] = PLAYER_INVINCIBILITY_TIME
          addComponent(world, DestroyFlag, pid)
          break
        }

        const armor = Health.armor[playerId]
        const reduction = armor / (armor + 100)
        const rawDamage = DamageOnContact.amount[pid]
        const finalDamage = rawDamage * (1 - reduction)

        Health.current[playerId] -= finalDamage

        // Reset flex timer on taking damage
        if (playerHasStats && PlayerStats.flexTimer[playerId] > 0) {
          PlayerStats.flexTimer[playerId] = 0.001
        }

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

        // Destroy the projectile (unless high pierce like poison cloud)
        DamageOnContact.hitCount[pid]++
        if (DamageOnContact.hitCount[pid] >= DamageOnContact.pierce[pid]) {
          addComponent(world, DestroyFlag, pid)
        }

        // Only one enemy projectile can hit per frame (i-frames)
        break
      }
    }
  }

  // ---- Enemy vs Player (contact damage) ----
  if (hasComponent(world, Invincible, playerId)) return

  for (let e = 0; e < enemies.length; e++) {
    const eid = enemies[e]

    if (hasComponent(world, DestroyFlag, eid)) continue
    if (!hasComponent(world, DamageOnContact, eid)) continue

    // Only deal contact damage during the lunge phase (state 2)
    if (hasComponent(world, EnemyAttack, eid) && EnemyAttack.state[eid] !== 2) continue

    const ex = Transform.x[eid]
    const ey = Transform.y[eid]
    const ez = Transform.z[eid]

    // Check vertical separation — enemies can't hit a player who jumped above them
    const dy = ply - ey
    if (dy > ENEMY_CONTACT_RADIUS) continue

    const dSq = distanceSq(plx, plz, ex, ez)

    if (dSq < ENEMY_CONTACT_SQ) {
      // Check evasion: player dodges the hit entirely
      if (playerHasStats) {
        const evasion = PlayerStats.evasion[playerId]
        if (evasion > 0 && Math.random() < evasion) {
          // Grant invincibility frames even on evasion to prevent rapid re-checks
          addComponent(world, Invincible, playerId)
          Invincible.timer[playerId] = PLAYER_INVINCIBILITY_TIME
          break
        }
      }

      // Flex passive: ignore damage if not hit in the last 3 seconds
      if (playerHasStats && PlayerStats.flexTimer[playerId] >= 3.0) {
        PlayerStats.flexTimer[playerId] = 0.001 // reset — took a "free" hit
        addComponent(world, Invincible, playerId)
        Invincible.timer[playerId] = PLAYER_INVINCIBILITY_TIME
        break
      }

      const armor = Health.armor[playerId]
      const reduction = armor / (armor + 100)
      const rawDamage = DamageOnContact.amount[eid]
      const finalDamage = rawDamage * (1 - reduction)

      Health.current[playerId] -= finalDamage

      // Reset flex timer on taking damage
      if (playerHasStats && PlayerStats.flexTimer[playerId] > 0) {
        PlayerStats.flexTimer[playerId] = 0.001
      }

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
