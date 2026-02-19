import { defineQuery, addComponent, hasComponent } from 'bitecs'
import { IsChest, Interactable } from '../../components/upgrades'
import { Transform } from '../../components/spatial'
import { DestroyFlag } from '../../components/tags'
import { Health } from '../../components/combat'
import { PlayerStats } from '../../components/stats'
import { PlayerControlled } from '../../components/movement'
import { ITEMS, ItemDef } from '../../data/items'
import { CHARACTERS } from '../../data/characters'
import { distanceSq } from '../../utils/math'
import { eventBus } from '../../core/EventBus'
import { sceneManager } from '../../core/SceneManager'
import type { GameWorld } from '../../world'
import * as THREE from 'three'

const chestQuery = defineQuery([IsChest, Interactable, Transform])

/**
 * Apply a single item effect to the player's stats.
 */
function applyItemEffect(world: GameWorld, effect: { stat: string; value: number; isPercent: boolean }): void {
  const eid = world.player.eid
  if (eid < 0) return

  const charDef = CHARACTERS.find(c => c.id === world.player.characterId)

  switch (effect.stat) {
    case 'damage':
      PlayerStats.damageMult[eid] += effect.value
      break
    case 'moveSpeed':
      PlayerStats.speedMult[eid] += effect.value
      PlayerControlled.moveSpeed[eid] = (charDef?.baseSpeed ?? 6) * PlayerStats.speedMult[eid]
      break
    case 'attackSpeed':
      PlayerStats.cooldownMult[eid] = Math.max(0.1, PlayerStats.cooldownMult[eid] - effect.value)
      break
    case 'maxHp':
      if (effect.isPercent) {
        const ratio = Health.current[eid] / Health.max[eid]
        Health.max[eid] *= (1 + effect.value)
        Health.current[eid] = ratio * Health.max[eid]
      } else {
        Health.max[eid] += effect.value
        Health.current[eid] += effect.value
      }
      break
    case 'armor':
      Health.armor[eid] += effect.value
      break
    case 'critDamage':
      PlayerStats.critDamage[eid] += effect.value
      break
    case 'crit':
      PlayerStats.critChance[eid] += effect.value
      break
    case 'lifesteal':
      PlayerStats.lifesteal[eid] += effect.value
      break
    case 'evasion':
      PlayerStats.evasion[eid] += effect.value
      break
    case 'xpGain':
      PlayerStats.xpGain[eid] += effect.value
      break
    case 'regen':
      PlayerStats.regen[eid] += effect.value
      break
    case 'pickupRange':
      PlayerStats.pickupRange[eid] += effect.value
      break
    case 'bossDamage':
      PlayerStats.bossDamageMult[eid] += effect.value
      break
    case 'idleDamage':
      PlayerStats.idleDamageMult[eid] += effect.value
      break
    case 'goldGain':
      PlayerStats.goldGain[eid] += effect.value
      break
  }
}

/**
 * Apply all effects from an item to the player.
 */
function applyItem(world: GameWorld, item: ItemDef): void {
  for (const effect of item.effects) {
    applyItemEffect(world, effect)
  }
  // Track collected items
  world.items.push(item.id)
}

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

      // Apply item effects to player
      applyItem(world, item)

      // Emit events for UI and other systems
      eventBus.emit('pickup:collected', {
        eid,
        type: 'item',
        value: 0,
      })
      eventBus.emit('item:collected', {
        itemId: item.id,
        name: item.name,
        rarity: item.rarity,
        x: cx,
        y: Transform.y[eid] + 1.5,
        z: cz,
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
