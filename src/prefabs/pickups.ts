import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, initTransform } from '../components/spatial'
import { IsPickup, IsXPGem } from '../components/tags'
import { IsGoldCoin } from '../components/upgrades'
import { XPValue, Lifetime } from '../components/lifecycle'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

/**
 * Create an XP gem pickup at the given world position.
 * The gem gets a small random upward velocity burst and a 30-second lifetime.
 * Returns the new entity id.
 */
export function createXPGem(world: GameWorld, x: number, y: number, z: number, amount: number): number {
  const eid = addEntity(world)

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  initTransform(eid, x, y, z)
  Transform.scaleX[eid] = 0.3
  Transform.scaleY[eid] = 0.3
  Transform.scaleZ[eid] = 0.3

  addComponent(world, Velocity, eid)
  // Small random upward burst so gems scatter visually on spawn
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
  const geometry = new THREE.IcosahedronGeometry(0.2, 0)
  const material = new THREE.MeshStandardMaterial({
    color: 0xCE93D8,
    emissive: 0xCE93D8,
    emissiveIntensity: 0.4,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
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
