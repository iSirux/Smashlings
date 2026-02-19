import * as THREE from 'three'
import { defineQuery, removeComponent } from 'bitecs'
import { FlashTimer } from '../../components/rendering'
import { sceneManager } from '../../core/SceneManager'
import type { GameWorld } from '../../world'

const flashQuery = defineQuery([FlashTimer])

/**
 * Shared white material used for the damage-flash effect.
 * A single instance is reused across all flashing entities to avoid
 * allocating a new material every hit.
 */
const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })

/**
 * Stores the original material(s) for each entity so they can be restored
 * once the flash expires.  Keyed by entity ID.
 */
const originalMaterials = new Map<number, THREE.Material | THREE.Material[]>()

/**
 * Swap the material of every THREE.Mesh descendant of `root` to the
 * white flash material.  The original material is saved the first time
 * we encounter the entity.
 */
function applyFlash(eid: number, root: THREE.Object3D): void {
  if (originalMaterials.has(eid)) return // already flashing

  // For a single-mesh entity the root itself is often a Mesh.
  // For grouped models we need to walk children.
  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // Store the original on first encounter only (keyed by eid).
      if (!originalMaterials.has(eid)) {
        originalMaterials.set(eid, child.material)
      }
      child.material = whiteMaterial
    }
  })
}

/**
 * Restore the original material(s) that were saved before the flash.
 */
function restoreOriginal(eid: number, root: THREE.Object3D): void {
  const saved = originalMaterials.get(eid)
  if (saved === undefined) return

  root.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = saved
    }
  })

  originalMaterials.delete(eid)
}

/**
 * Damage-flash system.
 *
 * While FlashTimer.remaining > 0 the entity's mesh material is replaced
 * with a solid-white MeshBasicMaterial.  Once the timer expires the
 * original material is restored and the FlashTimer component is removed.
 */
export function flashSystem(world: GameWorld, dt: number): void {
  const entities = flashQuery(world)

  for (let i = 0, len = entities.length; i < len; i++) {
    const eid = entities[i]

    FlashTimer.remaining[eid] -= dt

    const mesh = sceneManager.getMesh(eid)
    if (!mesh) continue

    if (FlashTimer.remaining[eid] > 0) {
      // Still flashing -- make sure the white material is applied
      applyFlash(eid, mesh)
    } else {
      // Flash expired -- restore original look and clean up
      restoreOriginal(eid, mesh)
      removeComponent(world, FlashTimer, eid)
    }
  }
}
