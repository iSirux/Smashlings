import { defineQuery, hasComponent, addComponent } from 'bitecs'
import { Health } from '../../components/combat'
import { Transform } from '../../components/spatial'
import { IsEnemy, IsPlayer, DestroyFlag } from '../../components/tags'
import { XPValue, EnemyType } from '../../components/lifecycle'
import { createXPGem } from '../../prefabs/pickups'
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
      // Determine XP drop amount from enemy definition
      let xpAmount = 5
      if (hasComponent(world, EnemyType, eid)) {
        const enemyIdx = EnemyType.id[eid]
        if (enemyIdx < ENEMIES.length) {
          xpAmount = ENEMIES[enemyIdx].xpValue
        }
      }

      // Spawn XP gem at enemy position
      createXPGem(world, x, y, z, xpAmount)

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
