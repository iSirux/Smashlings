import { defineQuery, addComponent } from 'bitecs'
import { Lifetime } from '../../components/lifecycle'
import { DestroyFlag } from '../../components/tags'
import type { GameWorld } from '../../world'

const lifetimeQuery = defineQuery([Lifetime])

/**
 * Ticks down Lifetime.remaining for all entities with the Lifetime component.
 * When remaining reaches zero or below, flags the entity for destruction.
 */
export function lifetimeSystem(world: GameWorld, dt: number): void {
  const entities = lifetimeQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]

    Lifetime.remaining[eid] -= dt

    if (Lifetime.remaining[eid] <= 0) {
      addComponent(world, DestroyFlag, eid)
    }
  }
}
