import { defineQuery } from 'bitecs'
import { AutoAttack, WeaponSlot } from '../../components/combat'
import { Transform } from '../../components/spatial'
import { IsEnemy } from '../../components/tags'
import {
  createSwordSlash,
  createArrow,
  createBullet,
  createBone,
  createAuraPulse,
  createKatanaSlash,
  createLightningBolt,
  createFireTrail,
  createPellet,
  createBoomerangProjectile,
  createFrostPulse,
  createDiceProjectile,
} from '../../prefabs/projectiles'
import { distanceSq } from '../../utils/math'
import type { GameWorld } from '../../world'

const weaponQuery = defineQuery([AutoAttack, WeaponSlot])
const enemyQuery = defineQuery([IsEnemy, Transform])

// Weapon ID to projectile factory mapping
// Directional factories: (world, x, y, z, dirX, dirZ, damage, knockback) => eid
type DirectionalFactory = (
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
) => number

// Area factories: (world, x, y, z, damage, size) => eid
type AreaFactory = (
  world: GameWorld,
  x: number, y: number, z: number,
  damage: number, size: number,
) => number

const directionalFactories: Record<number, DirectionalFactory> = {
  0: createSwordSlash,
  1: createArrow,
  2: createBullet,
  3: createBone,
  5: createKatanaSlash,
  6: createLightningBolt,
  8: createPellet,
  9: createBoomerangProjectile,
  11: createDiceProjectile,
}

const areaFactories: Record<number, AreaFactory> = {
  4: createAuraPulse,
  10: createFrostPulse,
}

// weaponId 7 = flamewalker (trail)

/**
 * Find the nearest enemy to (px, pz) within rangeSq.
 * Returns the enemy eid, or -1 if none found.
 * Also writes the direction into outDirX/outDirZ via the returned array.
 */
const _nearestResult = { eid: -1, dirX: 0, dirZ: 0 }
function findNearestEnemy(
  world: GameWorld,
  px: number, pz: number,
  rangeSq: number,
): typeof _nearestResult {
  const enemies = enemyQuery(world)
  let bestDistSq = rangeSq
  _nearestResult.eid = -1

  for (let i = 0; i < enemies.length; i++) {
    const eeid = enemies[i]
    const ex = Transform.x[eeid]
    const ez = Transform.z[eeid]
    const dSq = distanceSq(px, pz, ex, ez)
    if (dSq < bestDistSq) {
      bestDistSq = dSq
      _nearestResult.eid = eeid
    }
  }

  if (_nearestResult.eid !== -1) {
    const ex = Transform.x[_nearestResult.eid]
    const ez = Transform.z[_nearestResult.eid]
    const dx = ex - px
    const dz = ez - pz
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist > 0.001) {
      _nearestResult.dirX = dx / dist
      _nearestResult.dirZ = dz / dist
    } else {
      _nearestResult.dirX = 0
      _nearestResult.dirZ = 1
    }
  }

  return _nearestResult
}

/**
 * Ticks auto-attack cooldowns and fires weapons when ready.
 * Now queries weapon entities (AutoAttack + WeaponSlot) and reads
 * position/rotation from the owner (player) entity.
 */
export function autoAttackSystem(world: GameWorld, dt: number): void {
  const entities = weaponQuery(world)

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i]
    const ownerEid = WeaponSlot.ownerEid[eid]

    // Tick cooldown
    AutoAttack.cooldownTimer[eid] -= dt

    if (AutoAttack.cooldownTimer[eid] <= 0) {
      // Reset cooldown
      AutoAttack.cooldownTimer[eid] = AutoAttack.cooldown[eid]

      const pattern = AutoAttack.pattern[eid]
      const damage = AutoAttack.damage[eid]
      const knockback = AutoAttack.knockback[eid]
      const weaponId = AutoAttack.weaponId[eid]
      const range = AutoAttack.range[eid]
      const projCount = AutoAttack.projectileCount[eid] || 1

      // Read position from owner entity
      const px = Transform.x[ownerEid]
      const py = Transform.y[ownerEid] + 0.5
      const pz = Transform.z[ownerEid]

      if (pattern === 0) {
        // ── Pattern 0: Nearest ─────────────────────────────────────────
        const rangeSq = range * range
        const nearest = findNearestEnemy(world, px, pz, rangeSq)

        if (nearest.eid !== -1) {
          const factory = directionalFactories[weaponId]
          if (factory) {
            const spawnDist = 1.0
            const sx = px + nearest.dirX * spawnDist
            const sz = pz + nearest.dirZ * spawnDist

            for (let p = 0; p < projCount; p++) {
              // For multi-projectile weapons (e.g., revolver), add slight angular offset
              let dX = nearest.dirX
              let dZ = nearest.dirZ
              if (projCount > 1) {
                const angleOffset = (p - (projCount - 1) / 2) * 0.1
                const baseAngle = Math.atan2(dX, dZ) + angleOffset
                dX = Math.sin(baseAngle)
                dZ = Math.cos(baseAngle)
              }
              factory(world, sx, py, sz, dX, dZ, damage, knockback)
            }
          }
        }

      } else if (pattern === 1) {
        // ── Pattern 1: Forward ─────────────────────────────────────────
        const rotY = Transform.rotY[ownerEid]
        const dirX = Math.sin(rotY)
        const dirZ = Math.cos(rotY)

        const spawnDist = 1.5
        const sx = px + dirX * spawnDist
        const sz = pz + dirZ * spawnDist

        const factory = directionalFactories[weaponId]
        if (factory) {
          for (let p = 0; p < projCount; p++) {
            factory(world, sx, py, sz, dirX, dirZ, damage, knockback)
          }
        }

      } else if (pattern === 2) {
        // ── Pattern 2: Radial ──────────────────────────────────────────
        const factory = directionalFactories[weaponId]
        if (factory) {
          const angleStep = (Math.PI * 2) / projCount
          for (let p = 0; p < projCount; p++) {
            const angle = p * angleStep
            const dX = Math.sin(angle)
            const dZ = Math.cos(angle)
            const spawnDist = 1.0
            factory(world, px + dX * spawnDist, py, pz + dZ * spawnDist, dX, dZ, damage, knockback)
          }
        }

      } else if (pattern === 3) {
        // ── Pattern 3: Forward Spread ──────────────────────────────────
        const rotY = Transform.rotY[ownerEid]
        const baseAngle = rotY
        // Default spread of 30 degrees, converted to radians
        const spreadRad = (30 * Math.PI) / 180
        const factory = directionalFactories[weaponId]
        if (factory) {
          for (let p = 0; p < projCount; p++) {
            const t = projCount > 1 ? p / (projCount - 1) - 0.5 : 0
            const angle = baseAngle + t * spreadRad
            const dX = Math.sin(angle)
            const dZ = Math.cos(angle)
            const spawnDist = 1.0
            factory(world, px + dX * spawnDist, py, pz + dZ * spawnDist, dX, dZ, damage, knockback)
          }
        }

      } else if (pattern === 5) {
        // ── Pattern 5: Aura ────────────────────────────────────────────
        const factory = areaFactories[weaponId]
        if (factory) {
          factory(world, px, py - 0.3, pz, damage, range)
        }

      } else if (pattern === 6) {
        // ── Pattern 6: Trail ───────────────────────────────────────────
        // Leave damage zone at player's current position
        createFireTrail(world, px, 0.3, pz, damage)

      } else if (pattern === 7) {
        // ── Pattern 7: Homing (use nearest targeting for now) ──────────
        const rangeSq = range * range
        const nearest = findNearestEnemy(world, px, pz, rangeSq)

        if (nearest.eid !== -1) {
          const factory = directionalFactories[weaponId]
          if (factory) {
            const spawnDist = 1.0
            const sx = px + nearest.dirX * spawnDist
            const sz = pz + nearest.dirZ * spawnDist
            factory(world, sx, py, sz, nearest.dirX, nearest.dirZ, damage, knockback)
          }
        }
      }
    }
  }
}
