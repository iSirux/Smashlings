import { defineQuery, hasComponent } from 'bitecs'
import { IsShrine, Interactable } from '../../components/upgrades'
import { Transform } from '../../components/spatial'
import { Health } from '../../components/combat'
import { PlayerControlled } from '../../components/movement'
import { PlayerStats } from '../../components/stats'
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
  { stat: 'armor', value: 5, label: '+5 Armor' },
  { stat: 'evasion', value: 0.03, label: '+3% Evasion' },
  { stat: 'pickupRange', value: 2, label: '+2 Pickup Range' },
  { stat: 'xpGain', value: 0.10, label: '+10% XP Gain' },
]

// ── Per-shrine visual state ──────────────────────────────────────────────────

interface ShrineVFX {
  pillar: THREE.Mesh
  ring: THREE.Mesh
  fill: THREE.Mesh
  baseY: number
  wasInRange: boolean
}

const shrineVFX = new Map<number, ShrineVFX>()

function getOrCreateVFX(eid: number, sx: number, sz: number): ShrineVFX {
  let vfx = shrineVFX.get(eid)
  if (vfx) return vfx

  const baseY = Transform.y[eid] - 0.75 // ground level

  // Light pillar — translucent cylinder that grows upward during charging
  const pillarGeo = new THREE.CylinderGeometry(0.3, 0.6, 6, 8)
  const pillarMat = new THREE.MeshBasicMaterial({
    color: 0x80CBC4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const pillar = new THREE.Mesh(pillarGeo, pillarMat)
  pillar.position.set(sx, baseY + 3, sz)
  pillar.scale.set(1, 0, 1)
  pillar.visible = false
  sceneManager.scene.add(pillar)

  // Ground ring — shows the interaction radius
  const ringGeo = new THREE.RingGeometry(2.7, 3.0, 32)
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x80CBC4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = -Math.PI / 2
  ring.position.set(sx, baseY + 0.05, sz)
  ring.visible = false
  sceneManager.scene.add(ring)

  // Fill disc — scales outward from shrine center to the outer ring as charge builds
  const fillGeo = new THREE.CircleGeometry(2.7, 32)
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x80CBC4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const fill = new THREE.Mesh(fillGeo, fillMat)
  fill.rotation.x = -Math.PI / 2
  fill.position.set(sx, baseY + 0.03, sz)
  fill.scale.set(0, 0, 1)
  fill.visible = false
  sceneManager.scene.add(fill)

  vfx = { pillar, ring, fill, baseY, wasInRange: false }
  shrineVFX.set(eid, vfx)
  return vfx
}

// ── Apply stat boost to the player ───────────────────────────────────────────

function applyShrineBoost(world: GameWorld, boost: { stat: string; value: number }): void {
  const eid = world.player.eid
  if (eid < 0) return

  switch (boost.stat) {
    case 'damage':
      PlayerStats.damageMult[eid] += boost.value
      break
    case 'moveSpeed':
      PlayerStats.speedMult[eid] += boost.value
      PlayerControlled.moveSpeed[eid] *= (1 + boost.value)
      break
    case 'maxHp': {
      const oldMax = Health.max[eid]
      const ratio = Health.current[eid] / oldMax
      Health.max[eid] = oldMax * (1 + boost.value)
      Health.current[eid] = ratio * Health.max[eid]
      break
    }
    case 'attackSpeed':
      PlayerStats.cooldownMult[eid] = Math.max(0.1, PlayerStats.cooldownMult[eid] - boost.value)
      break
    case 'crit':
      PlayerStats.critChance[eid] += boost.value
      break
    case 'regen':
      PlayerStats.regen[eid] += boost.value
      break
    case 'armor':
      Health.armor[eid] += boost.value
      break
    case 'evasion':
      PlayerStats.evasion[eid] += boost.value
      break
    case 'pickupRange':
      PlayerStats.pickupRange[eid] += boost.value
      break
    case 'xpGain':
      PlayerStats.xpGain[eid] += boost.value
      break
  }
}

// ── Shrine system ────────────────────────────────────────────────────────────

/**
 * Handles shrine charging mechanics.
 * When the player stands near a shrine, it charges over time with escalating
 * visual feedback (light pillar, ground ring, pulsing mesh). Once fully charged
 * the shrine grants a random stat bonus, shows floating text, and deactivates.
 */
export function shrineSystem(world: GameWorld, dt: number): void {
  const playerEid = world.player.eid
  if (playerEid < 0) return

  const plx = Transform.x[playerEid]
  const plz = Transform.z[playerEid]

  const shrines = shrineQuery(world)
  const time = world.time.elapsed

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

    const vfx = getOrCreateVFX(eid, sx, sz)
    const inRange = dSq < rangeSq

    if (inRange) {
      // ── Charging ─────────────────────────────────────────────────────
      Interactable.chargeProgress[eid] += dt
      const chargeRatio = Math.min(
        Interactable.chargeProgress[eid] / Interactable.chargeTime[eid], 1,
      )

      // Shrine mesh: glow brighter + pulse scale + bob
      const mesh = sceneManager.getMesh(eid)
      if (mesh) {
        if (mesh instanceof THREE.Mesh) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.emissiveIntensity = 0.3 + chargeRatio * 2.0
        }
        const pulse = 1 + 0.08 * Math.sin(time * 4) * chargeRatio
        mesh.scale.set(pulse, pulse, pulse)
        mesh.position.y = vfx.baseY + 0.75 + 0.15 * Math.sin(time * 3) * chargeRatio
      }

      // Light pillar grows with charge
      vfx.pillar.visible = true
      const pillarMat = vfx.pillar.material as THREE.MeshBasicMaterial
      pillarMat.opacity = 0.15 + chargeRatio * 0.35
      vfx.pillar.scale.set(
        1 + chargeRatio * 0.5,
        chargeRatio,
        1 + chargeRatio * 0.5,
      )
      vfx.pillar.position.y = vfx.baseY + chargeRatio * 3
      vfx.pillar.rotation.y += dt * 0.5

      // Outer ring — fixed boundary
      vfx.ring.visible = true
      const ringMat = vfx.ring.material as THREE.MeshBasicMaterial
      ringMat.opacity = 0.35

      // Fill disc — expands outward from center to meet the outer ring
      vfx.fill.visible = true
      const fillMat = vfx.fill.material as THREE.MeshBasicMaterial
      fillMat.opacity = 0.08 + chargeRatio * 0.18
      vfx.fill.scale.set(chargeRatio, chargeRatio, 1)

      vfx.wasInRange = true

      // ── Fully charged → activate ────────────────────────────────────
      if (Interactable.chargeProgress[eid] >= Interactable.chargeTime[eid]) {
        Interactable.activated[eid] = 1

        // Pick a random stat boost and apply it
        const boost = SHRINE_BOOSTS[Math.floor(Math.random() * SHRINE_BOOSTS.length)]
        applyShrineBoost(world, boost)

        // Emit shrine:activated (main.ts uses this for floating text + weapon recompute)
        eventBus.emit('shrine:activated', {
          stat: boost.stat,
          value: boost.value,
          label: boost.label,
          x: sx,
          y: vfx.baseY + 2.5,
          z: sz,
        })

        // Deactivate shrine mesh
        if (mesh) {
          if (mesh instanceof THREE.Mesh) {
            const mat = mesh.material as THREE.MeshStandardMaterial
            mat.color.setHex(0x666666)
            mat.emissive.setHex(0x333333)
            mat.emissiveIntensity = 0.1
          }
          mesh.scale.set(1, 1, 1)
          mesh.position.y = vfx.baseY + 0.75
        }

        // Clean up VFX objects
        sceneManager.scene.remove(vfx.pillar)
        sceneManager.scene.remove(vfx.ring)
        sceneManager.scene.remove(vfx.fill)
        vfx.pillar.geometry.dispose()
        ;(vfx.pillar.material as THREE.Material).dispose()
        vfx.ring.geometry.dispose()
        ;(vfx.ring.material as THREE.Material).dispose()
        vfx.fill.geometry.dispose()
        ;(vfx.fill.material as THREE.Material).dispose()
        shrineVFX.delete(eid)
      }
    } else {
      // ── Out of range — charge pauses, visuals idle ─────────────────
      if (vfx.wasInRange) {
        // Stop pulsing — reset shrine mesh to resting pose
        const mesh = sceneManager.getMesh(eid)
        if (mesh) {
          mesh.scale.set(1, 1, 1)
          mesh.position.y = vfx.baseY + 0.75
        }

        // Dim the pillar but keep it visible at current charge
        if (vfx.pillar.visible) {
          const pillarMat = vfx.pillar.material as THREE.MeshBasicMaterial
          pillarMat.opacity = Math.max(0.05, pillarMat.opacity - dt * 0.5)
        }

        // Dim the ring but keep it visible
        if (vfx.ring.visible) {
          const ringMat = vfx.ring.material as THREE.MeshBasicMaterial
          ringMat.opacity = Math.max(0.08, ringMat.opacity - dt * 0.5)
        }

        // Dim the fill disc but keep its size
        if (vfx.fill.visible) {
          const fillMat = vfx.fill.material as THREE.MeshBasicMaterial
          fillMat.opacity = Math.max(0.05, fillMat.opacity - dt * 0.5)
        }

        // Dim shrine glow
        if (mesh && mesh instanceof THREE.Mesh) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.emissiveIntensity = Math.max(0.3, mat.emissiveIntensity - dt * 0.5)
        }
      }
    }
  }
}
