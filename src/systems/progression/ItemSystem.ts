import { defineQuery, addComponent, hasComponent } from 'bitecs'
import { IsChest, Interactable } from '../../components/upgrades'
import { Transform } from '../../components/spatial'
import { DestroyFlag } from '../../components/tags'
import { ITEMS } from '../../data/items'
import { distanceSq } from '../../utils/math'
import { eventBus } from '../../core/EventBus'
import { sceneManager } from '../../core/SceneManager'
import type { GameWorld } from '../../world'
import * as THREE from 'three'

const chestQuery = defineQuery([IsChest, Interactable, Transform])

/**
 * Handles chest interaction and item granting.
 * When the player is within interaction range of a chest, the chest opens
 * and grants a random item from the ITEMS pool.
 */
export function itemSystem(world: GameWorld, dt: number): void {
  const playerEid = world.player.eid
  if (playerEid < 0) return

  const plx = Transform.x[playerEid]
  const plz = Transform.z[playerEid]

  const chests = chestQuery(world)

  for (let i = 0; i < chests.length; i++) {
    const eid = chests[i]

    // Skip already activated or destroyed chests
    if (Interactable.activated[eid] === 1) continue
    if (hasComponent(world, DestroyFlag, eid)) continue

    const cx = Transform.x[eid]
    const cz = Transform.z[eid]

    const range = Interactable.range[eid]
    const rangeSq = range * range
    const dSq = distanceSq(plx, plz, cx, cz)

    if (dSq < rangeSq) {
      // Chest interaction is instant (chargeTime = 0)
      // Mark as activated
      Interactable.activated[eid] = 1

      // Pick a random item
      const item = ITEMS[Math.floor(Math.random() * ITEMS.length)]

      // Log the item pickup
      console.log(`[Item] Picked up: ${item.name} (${item.rarity}) - ${item.description}`)

      // Emit a pickup event for UI or other systems
      eventBus.emit('pickup:collected', {
        eid,
        type: 'item',
        value: 0,
      })

      // Change chest mesh color to indicate it's been opened
      const mesh = sceneManager.getMesh(eid)
      if (mesh && mesh instanceof THREE.Mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.color.setHex(0x666666)
        mat.emissive.setHex(0x000000)
      }
    }
  }
}
