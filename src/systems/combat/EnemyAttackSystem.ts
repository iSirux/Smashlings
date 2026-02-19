import { defineQuery, hasComponent } from 'bitecs'
import { IsEnemy, IsPlayer, DestroyFlag } from '../../components/tags'
import { EnemyAttack } from '../../components/combat'
import { EnemyType } from '../../components/lifecycle'
import { Transform, Velocity } from '../../components/spatial'
import { AIFollow } from '../../components/movement'
import { ENEMIES } from '../../data/enemies'
import { distanceSq } from '../../utils/math'
import type { GameWorld } from '../../world'

/** Attack states */
const IDLE = 0
const WINDUP = 1
const LUNGE = 2
const COOLDOWN = 3

/** Default timing constants (used when no meleeConfig is defined) */
const DEFAULT_LUNGE_RANGE = 2.5
const DEFAULT_LUNGE_RANGE_SQ = DEFAULT_LUNGE_RANGE * DEFAULT_LUNGE_RANGE
const DEFAULT_WINDUP_TIME = 0.25
const DEFAULT_LUNGE_TIME = 0.15
const DEFAULT_COOLDOWN_TIME = 0.5
const DEFAULT_LUNGE_SPEED_MULT = 3.5

const enemyAttackQuery = defineQuery([IsEnemy, EnemyAttack, Transform, Velocity])
const playerQuery = defineQuery([IsPlayer, Transform])

/**
 * Enemy melee lunge attack system.
 *
 * When an enemy gets within trigger range, it enters a windup (telegraph),
 * then lunges forward quickly, then enters a brief cooldown.
 * Visual squish/stretch on the mesh communicates each phase.
 *
 * Reads per-enemy melee config from EnemyDef.meleeConfig if available.
 */
export function enemyAttackSystem(world: GameWorld, dt: number): void {
  const enemies = enemyAttackQuery(world)
  const players = playerQuery(world)
  if (players.length === 0) return

  const playerId = players[0]
  const plx = Transform.x[playerId]
  const plz = Transform.z[playerId]

  for (let i = 0; i < enemies.length; i++) {
    const eid = enemies[i]
    if (hasComponent(world, DestroyFlag, eid)) continue

    const state = EnemyAttack.state[eid]
    const ex = Transform.x[eid]
    const ez = Transform.z[eid]

    // Look up per-enemy melee config
    const enemyIdx = hasComponent(world, EnemyType, eid) ? EnemyType.id[eid] : -1
    const def = enemyIdx >= 0 ? ENEMIES[enemyIdx] : undefined
    const mc = def?.meleeConfig

    const lungeRange = mc ? mc.lungeRange : DEFAULT_LUNGE_RANGE
    const lungeRangeSq = lungeRange * lungeRange
    const windupTime = mc ? mc.windupTime : DEFAULT_WINDUP_TIME
    const lungeTime = mc ? mc.lungeTime : DEFAULT_LUNGE_TIME
    const cooldownTime = mc ? mc.cooldownTime : DEFAULT_COOLDOWN_TIME
    const lungeSpeedMult = mc ? mc.lungeSpeedMult : DEFAULT_LUNGE_SPEED_MULT

    switch (state) {
      case IDLE: {
        // Check if in trigger range
        const dSq = distanceSq(plx, plz, ex, ez)
        if (dSq < lungeRangeSq && dSq > 0.0001) {
          // Lock direction toward player
          const dist = Math.sqrt(dSq)
          EnemyAttack.dirX[eid] = (plx - ex) / dist
          EnemyAttack.dirZ[eid] = (plz - ez) / dist
          EnemyAttack.state[eid] = WINDUP
          EnemyAttack.timer[eid] = windupTime

          // Stop movement during windup
          Velocity.x[eid] = 0
          Velocity.z[eid] = 0

          // Squish down (telegraph)
          Transform.scaleY[eid] = 0.6
          Transform.scaleX[eid] = 1.3
          Transform.scaleZ[eid] = 1.3
        }
        break
      }

      case WINDUP: {
        EnemyAttack.timer[eid] -= dt
        // Keep velocity zeroed
        Velocity.x[eid] = 0
        Velocity.z[eid] = 0

        if (EnemyAttack.timer[eid] <= 0) {
          // Transition to lunge
          EnemyAttack.state[eid] = LUNGE
          EnemyAttack.timer[eid] = lungeTime

          // Stretch forward
          Transform.scaleY[eid] = 1.3
          Transform.scaleX[eid] = 0.8
          Transform.scaleZ[eid] = 0.8
        }
        break
      }

      case LUNGE: {
        EnemyAttack.timer[eid] -= dt

        // Move fast in locked direction
        const speed = AIFollow.speed[eid] * lungeSpeedMult
        Velocity.x[eid] = EnemyAttack.dirX[eid] * speed
        Velocity.z[eid] = EnemyAttack.dirZ[eid] * speed

        // Face lunge direction
        Transform.rotY[eid] = Math.atan2(EnemyAttack.dirX[eid], EnemyAttack.dirZ[eid])

        if (EnemyAttack.timer[eid] <= 0) {
          // Transition to cooldown
          EnemyAttack.state[eid] = COOLDOWN
          EnemyAttack.timer[eid] = cooldownTime

          Velocity.x[eid] = 0
          Velocity.z[eid] = 0

          // Slight squish on landing
          Transform.scaleY[eid] = 0.85
          Transform.scaleX[eid] = 1.1
          Transform.scaleZ[eid] = 1.1
        }
        break
      }

      case COOLDOWN: {
        EnemyAttack.timer[eid] -= dt
        Velocity.x[eid] = 0
        Velocity.z[eid] = 0

        // Lerp scale back to normal
        const t = 1 - (EnemyAttack.timer[eid] / cooldownTime)
        Transform.scaleX[eid] = 1.1 + (1 - 1.1) * t
        Transform.scaleY[eid] = 0.85 + (1 - 0.85) * t
        Transform.scaleZ[eid] = 1.1 + (1 - 1.1) * t

        if (EnemyAttack.timer[eid] <= 0) {
          EnemyAttack.state[eid] = IDLE
          EnemyAttack.timer[eid] = 0
          Transform.scaleX[eid] = 1
          Transform.scaleY[eid] = 1
          Transform.scaleZ[eid] = 1
        }
        break
      }
    }
  }
}
