import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, initTransform } from '../components/spatial'
import { IsEnemy } from '../components/tags'
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
  initTransform(eid, x, def.meshScale[1] * 0.5, z)

  addComponent(world, Velocity, eid)

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsEnemy, eid)

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
  const geometry = new THREE.BoxGeometry(
    def.meshScale[0],
    def.meshScale[1],
    def.meshScale[2],
  )
  const material = new THREE.MeshStandardMaterial({ color: def.meshColor })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.position.set(x, def.meshScale[1] * 0.5, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}
