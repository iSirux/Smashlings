import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, Collider, initTransform } from '../components/spatial'
import { IsEnemy, IsBoss } from '../components/tags'
import { Health, DamageOnContact } from '../components/combat'
import { AIFollow } from '../components/movement'
import { EnemyType } from '../components/lifecycle'
import { ENEMIES } from '../data/enemies'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

/**
 * Create an enemy entity from the ENEMIES data table.
 * The enemyIndex corresponds to the index in the ENEMIES array.
 * Returns the new entity id.
 */
export function createEnemy(world: GameWorld, enemyIndex: number, x: number, z: number): number {
  const eid = addEntity(world)
  const def = ENEMIES[enemyIndex]

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  const halfH = def.meshScale[1] * 0.5
  const enemyTerrainY = sceneManager.getTerrainHeight(x, z)
  initTransform(eid, x, enemyTerrainY + halfH, z)

  addComponent(world, Velocity, eid)

  addComponent(world, Collider, eid)
  Collider.radius[eid] = Math.max(def.meshScale[0], def.meshScale[2]) * 0.5
  Collider.halfHeight[eid] = halfH

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsEnemy, eid)

  if (def.isBoss) {
    addComponent(world, IsBoss, eid)
  }

  // ── Health ───────────────────────────────────────────────────────────
  addComponent(world, Health, eid)
  Health.current[eid] = def.health
  Health.max[eid] = def.health
  Health.armor[eid] = 0

  // ── Contact damage ───────────────────────────────────────────────────
  addComponent(world, DamageOnContact, eid)
  DamageOnContact.amount[eid] = def.damage
  DamageOnContact.knockback[eid] = 0
  DamageOnContact.pierce[eid] = 255 // enemies can hit unlimited times
  DamageOnContact.hitCount[eid] = 0

  // ── AI ───────────────────────────────────────────────────────────────
  addComponent(world, AIFollow, eid)
  AIFollow.targetEid[eid] = world.player.eid
  AIFollow.speed[eid] = def.speed

  // ── Enemy type identifier ────────────────────────────────────────────
  addComponent(world, EnemyType, eid)
  EnemyType.id[eid] = enemyIndex

  // ── Mesh ─────────────────────────────────────────────────────────────
  let geometry: THREE.BufferGeometry

  if (def.isBoss) {
    // Bosses use sphere geometry with strong emissive glow
    const radius = Math.max(def.meshScale[0], def.meshScale[1], def.meshScale[2]) * 0.5
    geometry = new THREE.SphereGeometry(radius, 16, 16)
  } else if (def.isMiniBoss) {
    // Mini-bosses use sphere geometry with moderate emissive glow
    const radius = Math.max(def.meshScale[0], def.meshScale[1], def.meshScale[2]) * 0.5
    geometry = new THREE.SphereGeometry(radius, 12, 12)
  } else {
    geometry = new THREE.BoxGeometry(
      def.meshScale[0],
      def.meshScale[1],
      def.meshScale[2],
    )
  }

  const materialOpts: THREE.MeshStandardMaterialParameters = { color: def.meshColor }
  if (def.isBoss) {
    materialOpts.emissive = def.meshColor
    materialOpts.emissiveIntensity = 0.5
  } else if (def.isMiniBoss) {
    materialOpts.emissive = def.meshColor
    materialOpts.emissiveIntensity = 0.3
  }
  const material = new THREE.MeshStandardMaterial(materialOpts)

  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.position.set(x, enemyTerrainY + halfH, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}
