import { defineQuery, removeComponent } from 'bitecs'
import { Invincible } from '../../components/combat'
import type { GameWorld } from '../../world'

const invincibleQuery = defineQuery([Invincible])

/**
 * Ticks down invincibility timers and removes the Invincible component
 * once the timer expires.
 */
export function invincibilitySystem(world: GameWorld, dt: number): void {
  const entities = invincibleQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]

    Invincible.timer[eid] -= dt

    if (Invincible.timer[eid] <= 0) {
      removeComponent(world, Invincible, eid)
    }
  }
}
