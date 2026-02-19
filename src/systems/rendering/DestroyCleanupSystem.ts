import { defineQuery, removeEntity } from 'bitecs'
import { DestroyFlag } from '../../components/tags'
import { sceneManager } from '../../core/SceneManager'
import type { GameWorld } from '../../world'

const destroyQuery = defineQuery([DestroyFlag])

/**
 * End-of-frame cleanup system.
 *
 * Any entity tagged with DestroyFlag is fully removed:
 *   1. Its Three.js mesh (if any) is taken out of the scene and its
 *      geometry / materials are disposed to free GPU memory.
 *   2. The entity itself is removed from the ECS world.
 *
 * **This system MUST run last in the frame** so that every other system
 * has had the opportunity to read or react to the doomed entities before
 * they disappear.
 */
export function destroyCleanupSystem(world: GameWorld, _dt: number): void {
  const entities = destroyQuery(world)

  for (let i = 0, len = entities.length; i < len; i++) {
    const eid = entities[i]

    // Remove and dispose the Three.js Object3D (geometry + materials).
    // sceneManager.removeMesh is a no-op if there is no mesh for this eid.
    sceneManager.removeMesh(eid)

    // Remove the entity and all its components from the ECS world.
    removeEntity(world, eid)
  }
}
