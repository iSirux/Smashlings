import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, initTransform } from '../components/spatial'
import { IsPickup, IsXPGem } from '../components/tags'
import { IsGoldCoin } from '../components/upgrades'
import { XPValue, Lifetime } from '../components/lifecycle'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

// ── XP Gem Tiers ─────────────────────────────────────────────────────────────
// Like coins/nickels/dimes/quarters — different color, shape, and size per tier

interface GemTierDef {
  value: number
  color: number
  emissiveIntensity: number
  scale: number
  lightIntensity: number
  lightDistance: number
}

const GEM_TIERS: GemTierDef[] = [
  { value: 1,   color: 0x66BB6A, emissiveIntensity: 0.3, scale: 0.35, lightIntensity: 0.15, lightDistance: 1.5 }, // Shard  (green)
  { value: 5,   color: 0x42A5F5, emissiveIntensity: 0.4, scale: 0.45, lightIntensity: 0.4,  lightDistance: 2.5 }, // Gem    (blue)
  { value: 25,  color: 0xCE93D8, emissiveIntensity: 0.5, scale: 0.55, lightIntensity: 0.8,  lightDistance: 4.0 }, // Crystal(purple)
  { value: 100, color: 0xFFD54F, emissiveIntensity: 0.8, scale: 0.7,  lightIntensity: 1.5,  lightDistance: 6.0 }, // Diamond(gold)
]

// Cached geometries — one per tier, shared across all gems
const _geoCache: THREE.BufferGeometry[] = []
function getGemGeometry(tier: number): THREE.BufferGeometry {
  if (!_geoCache[tier]) {
    switch (tier) {
      case 0:  _geoCache[tier] = new THREE.TetrahedronGeometry(0.18, 0);  break
      case 1:  _geoCache[tier] = new THREE.IcosahedronGeometry(0.2, 0);   break
      case 2:  _geoCache[tier] = new THREE.OctahedronGeometry(0.25, 0);   break
      default: _geoCache[tier] = new THREE.DodecahedronGeometry(0.3, 0);  break
    }
  }
  return _geoCache[tier]
}

/**
 * Create a single XP gem pickup at the given world position.
 * Tier determines the visual style (0=shard, 1=gem, 2=crystal, 3=diamond).
 */
export function createXPGem(
  world: GameWorld,
  x: number, y: number, z: number,
  amount: number,
  tier: number = 0,
): number {
  const eid = addEntity(world)
  const def = GEM_TIERS[tier] ?? GEM_TIERS[0]

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  initTransform(eid, x, y, z)
  Transform.scaleX[eid] = def.scale
  Transform.scaleY[eid] = def.scale
  Transform.scaleZ[eid] = def.scale

  addComponent(world, Velocity, eid)
  Velocity.x[eid] = (Math.random() - 0.5) * 3
  Velocity.y[eid] = 3 + Math.random() * 2
  Velocity.z[eid] = (Math.random() - 0.5) * 3

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsPickup, eid)
  addComponent(world, IsXPGem, eid)

  // ── XP value ─────────────────────────────────────────────────────────
  addComponent(world, XPValue, eid)
  XPValue.amount[eid] = amount

  // ── Lifetime ─────────────────────────────────────────────────────────
  addComponent(world, Lifetime, eid)
  Lifetime.remaining[eid] = 30

  // ── Mesh ─────────────────────────────────────────────────────────────
  const geometry = getGemGeometry(tier)
  const material = new THREE.MeshStandardMaterial({
    color: def.color,
    emissive: def.color,
    emissiveIntensity: def.emissiveIntensity,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)

  // Point light only on tier 2+ (crystal/diamond) to avoid perf hit from many shards
  if (tier >= 2) {
    const light = new THREE.PointLight(def.color, def.lightIntensity, def.lightDistance)
    light.decay = 2
    mesh.add(light)
  }

  sceneManager.addMesh(eid, mesh)

  return eid
}

/**
 * Break totalXP into denomination-style gem tiers and spawn them all.
 * Produces a satisfying shower: small enemies → handful of shards,
 * bosses → spectacular mix of diamonds, crystals, gems, and shards.
 */
export function spawnXPDrop(
  world: GameWorld,
  x: number, y: number, z: number,
  totalXP: number,
): void {
  const counts = [0, 0, 0, 0]
  let remaining = totalXP

  // Greedy breakdown, largest denomination first
  for (let t = GEM_TIERS.length - 1; t >= 0; t--) {
    counts[t] = Math.floor(remaining / GEM_TIERS[t].value)
    remaining %= GEM_TIERS[t].value
  }

  // Break higher-tier gems down until we reach a satisfying count.
  // Keeps at least 1 of each tier present for visual variety.
  const target = Math.min(totalXP, 20)
  let total = counts[0] + counts[1] + counts[2] + counts[3]

  while (total < target) {
    let broke = false

    // First: break from highest tier that has >1 (preserves variety)
    for (let t = GEM_TIERS.length - 1; t >= 1; t--) {
      if (counts[t] > 1) {
        counts[t]--
        counts[t - 1] += GEM_TIERS[t].value / GEM_TIERS[t - 1].value
        total = counts[0] + counts[1] + counts[2] + counts[3]
        broke = true
        break
      }
    }

    // Second: if all tiers have ≤1, break the lowest tier with 1
    if (!broke) {
      for (let t = 1; t < GEM_TIERS.length; t++) {
        if (counts[t] > 0) {
          counts[t]--
          counts[t - 1] += GEM_TIERS[t].value / GEM_TIERS[t - 1].value
          total = counts[0] + counts[1] + counts[2] + counts[3]
          broke = true
          break
        }
      }
    }

    if (!broke) break
  }

  // Spawn all gems
  for (let t = GEM_TIERS.length - 1; t >= 0; t--) {
    for (let i = 0; i < counts[t]; i++) {
      createXPGem(world, x, y, z, GEM_TIERS[t].value, t)
    }
  }
}

/**
 * Create a gold coin pickup at the given world position.
 * The coin gets a small random upward velocity burst and a 20-second lifetime.
 * The gold amount is stored in the XPValue component for reuse.
 * Returns the new entity id.
 */
export function createGoldCoin(world: GameWorld, x: number, y: number, z: number, amount: number): number {
  const eid = addEntity(world)

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  initTransform(eid, x, y, z)
  Transform.scaleX[eid] = 0.3
  Transform.scaleY[eid] = 0.3
  Transform.scaleZ[eid] = 0.3

  addComponent(world, Velocity, eid)
  // Small random upward burst so coins scatter visually on spawn
  Velocity.x[eid] = (Math.random() - 0.5) * 2
  Velocity.y[eid] = 2 + Math.random() * 2
  Velocity.z[eid] = (Math.random() - 0.5) * 2

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsPickup, eid)
  addComponent(world, IsGoldCoin, eid)

  // ── Gold amount (reusing XPValue to store the gold value) ───────────
  addComponent(world, XPValue, eid)
  XPValue.amount[eid] = amount

  // ── Lifetime ─────────────────────────────────────────────────────────
  addComponent(world, Lifetime, eid)
  Lifetime.remaining[eid] = 20

  // ── Mesh ─────────────────────────────────────────────────────────────
  const geometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 8)
  const material = new THREE.MeshStandardMaterial({
    color: 0xFFD54F,
    emissive: 0xFFD54F,
    emissiveIntensity: 0.4,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  // Tilt the coin so it appears face-on
  mesh.rotation.x = Math.PI / 2
  sceneManager.addMesh(eid, mesh)

  return eid
}
