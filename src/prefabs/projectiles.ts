import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, initTransform } from '../components/spatial'
import { IsProjectile } from '../components/tags'
import { DamageOnContact } from '../components/combat'
import { Lifetime } from '../components/lifecycle'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

/**
 * Create a sword slash projectile that faces a direction.
 * The slash is a short-lived box that damages enemies on contact.
 * Returns the new entity id.
 */
export function createSwordSlash(
  world: GameWorld,
  x: number,
  y: number,
  z: number,
  dirX: number,
  dirZ: number,
  damage: number,
  knockback: number,
): number {
  const eid = addEntity(world)

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  initTransform(eid, x, y, z)
  Transform.scaleX[eid] = 1.5
  Transform.scaleY[eid] = 0.3
  Transform.scaleZ[eid] = 0.5
  // Orient the slash to face the attack direction
  Transform.rotY[eid] = Math.atan2(dirX, dirZ)

  addComponent(world, Velocity, eid)
  // Sword slash moves slowly forward with the swing
  const speed = 12
  Velocity.x[eid] = dirX * speed
  Velocity.y[eid] = 0
  Velocity.z[eid] = dirZ * speed

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsProjectile, eid)

  // ── Contact damage ───────────────────────────────────────────────────
  addComponent(world, DamageOnContact, eid)
  DamageOnContact.amount[eid] = damage
  DamageOnContact.knockback[eid] = knockback
  DamageOnContact.pierce[eid] = 3 // can hit up to 3 enemies
  DamageOnContact.hitCount[eid] = 0

  // ── Lifetime ─────────────────────────────────────────────────────────
  addComponent(world, Lifetime, eid)
  Lifetime.remaining[eid] = 0.15 // short slash duration

  // ── Mesh ─────────────────────────────────────────────────────────────
  const geometry = new THREE.BoxGeometry(1.5, 0.3, 0.5)
  const material = new THREE.MeshBasicMaterial({ color: 0xFFF176 })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  // Orient the mesh to match the slash direction
  mesh.rotation.y = Math.atan2(dirX, dirZ)
  sceneManager.addMesh(eid, mesh)

  return eid
}
