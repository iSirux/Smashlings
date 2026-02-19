import { defineQuery, hasComponent, addComponent } from 'bitecs'
import { Health } from '../../components/combat'
import { PlayerStats } from '../../components/stats'
import { Transform } from '../../components/spatial'
import { IsEnemy, IsPlayer, IsBoss, DestroyFlag } from '../../components/tags'
import { XPValue, EnemyType } from '../../components/lifecycle'
import { spawnXPDrop } from '../../prefabs/pickups'
import { eventBus } from '../../core/EventBus'
import { ENEMIES } from '../../data/enemies'
import type { GameWorld } from '../../world'

const healthQuery = defineQuery([Health])

/**
 * Checks all entities with Health. When current HP drops to zero or below,
 * flags the entity for destruction and handles death side-effects.
 */
export function healthSystem(world: GameWorld, dt: number): void {
  const entities = healthQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]

    if (Health.current[eid] > 0) continue

    // Already flagged -- don't process twice
    if (hasComponent(world, DestroyFlag, eid)) continue

    addComponent(world, DestroyFlag, eid)

    const x = Transform.x[eid]
    const y = Transform.y[eid]
    const z = Transform.z[eid]

    if (hasComponent(world, IsEnemy, eid)) {
      // Determine XP drop amount and gold from enemy definition
      let xpAmount = 5
      let goldAmount = 0
      let isBossOrMiniBoss = false

      if (hasComponent(world, EnemyType, eid)) {
        const enemyIdx = EnemyType.id[eid]
        if (enemyIdx < ENEMIES.length) {
          const def = ENEMIES[enemyIdx]
          xpAmount = def.xpValue

          // Gold drops
          if (def.isBoss) {
            goldAmount = def.goldDrop ?? 50
            isBossOrMiniBoss = true
          } else if (def.isMiniBoss) {
            goldAmount = def.goldDrop ?? 20
            isBossOrMiniBoss = true
          } else {
            // Regular enemies: 20% chance to drop 1 gold
            if (Math.random() < 0.2) {
              goldAmount = 1
            }
          }
        }
      }

      // Spawn XP gems at enemy position (breaks into denomination tiers)
      spawnXPDrop(world, x, y, z, xpAmount)

      // Award gold directly (scaled by difficulty + cursed tome)
      if (goldAmount > 0) {
        const playerEid = world.player.eid
        const cursed = (playerEid >= 0 && hasComponent(world, PlayerStats, playerEid))
          ? PlayerStats.cursedMult[playerEid] : 0
        const goldGain = (playerEid >= 0 && hasComponent(world, PlayerStats, playerEid))
          ? PlayerStats.goldGain[playerEid] || 1.0 : 1.0
        world.player.gold += Math.round(goldAmount * world.difficulty.goldMult * (1 + cursed) * goldGain)
      }

      world.player.kills++

      eventBus.emit('entity:died', {
        eid,
        x,
        y,
        z,
        wasEnemy: true,
      })
    } else if (hasComponent(world, IsPlayer, eid)) {
      eventBus.emit('player:died', {
        timeAlive: world.time.elapsed,
        kills: world.player.kills,
      })
    }
  }
}
