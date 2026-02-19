import { defineQuery, hasComponent } from 'bitecs'
import { IsShrine, Interactable } from '../../components/upgrades'
import { Transform } from '../../components/spatial'
import { DestroyFlag } from '../../components/tags'
import { distanceSq } from '../../utils/math'
import { eventBus } from '../../core/EventBus'
import { sceneManager } from '../../core/SceneManager'
import type { GameWorld } from '../../world'
import * as THREE from 'three'

const shrineQuery = defineQuery([IsShrine, Interactable, Transform])

// Possible shrine stat boosts
const SHRINE_BOOSTS = [
  { stat: 'damage', value: 0.10, label: '+10% Damage' },
  { stat: 'moveSpeed', value: 0.08, label: '+8% Move Speed' },
  { stat: 'maxHp', value: 0.10, label: '+10% Max HP' },
  { stat: 'attackSpeed', value: 0.06, label: '+6% Attack Speed' },
  { stat: 'crit', value: 0.05, label: '+5% Crit Chance' },
  { stat: 'regen', value: 1.0, label: '+1 HP/s Regen' },
  { stat: 'armor', value: 0.05, label: '+5% Armor' },
  { stat: 'evasion', value: 0.03, label: '+3% Evasion' },
  { stat: 'pickupRange', value: 2, label: '+2 Pickup Range' },
  { stat: 'xpGain', value: 0.10, label: '+10% XP Gain' },
]

/**
 * Handles shrine charging mechanics.
 * When the player stands near a shrine, it charges over time.
 * Once fully charged, the shrine grants a random stat bonus and deactivates.
 */
export function shrineSystem(world: GameWorld, dt: number): void {
  const playerEid = world.player.eid
  if (playerEid < 0) return

  const plx = Transform.x[playerEid]
  const plz = Transform.z[playerEid]

  const shrines = shrineQuery(world)

  for (let i = 0; i < shrines.length; i++) {
    const eid = shrines[i]

    // Skip already activated or destroyed shrines
    if (Interactable.activated[eid] === 1) continue
    if (hasComponent(world, DestroyFlag, eid)) continue

    const sx = Transform.x[eid]
    const sz = Transform.z[eid]

    const range = Interactable.range[eid]
    const rangeSq = range * range
    const dSq = distanceSq(plx, plz, sx, sz)

    if (dSq < rangeSq) {
      // Player is within range, increment charge
      Interactable.chargeProgress[eid] += dt

      // Visual feedback: make shrine glow brighter as it charges
      const chargeRatio = Math.min(Interactable.chargeProgress[eid] / Interactable.chargeTime[eid], 1)
      const mesh = sceneManager.getMesh(eid)
      if (mesh && mesh instanceof THREE.Mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.emissiveIntensity = 0.3 + chargeRatio * 0.7
      }

      // Check if fully charged
      if (Interactable.chargeProgress[eid] >= Interactable.chargeTime[eid]) {
        // Activate the shrine
        Interactable.activated[eid] = 1

        // Pick a random stat boost
        const boost = SHRINE_BOOSTS[Math.floor(Math.random() * SHRINE_BOOSTS.length)]

        console.log(`[Shrine] Activated! Granted: ${boost.label}`)

        // Emit pickup event
        eventBus.emit('pickup:collected', {
          eid,
          type: 'shrine',
          value: 0,
        })

        // Change mesh color to gray to indicate deactivation
        if (mesh && mesh instanceof THREE.Mesh) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.color.setHex(0x666666)
          mat.emissive.setHex(0x333333)
          mat.emissiveIntensity = 0.1
        }
      }
    } else {
      // Player left range, decay charge slowly
      if (Interactable.chargeProgress[eid] > 0) {
        Interactable.chargeProgress[eid] = Math.max(0, Interactable.chargeProgress[eid] - dt * 0.5)

        // Update visual feedback
        const chargeRatio = Interactable.chargeProgress[eid] / Interactable.chargeTime[eid]
        const mesh = sceneManager.getMesh(eid)
        if (mesh && mesh instanceof THREE.Mesh) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.emissiveIntensity = 0.3 + chargeRatio * 0.7
        }
      }
    }
  }
}
