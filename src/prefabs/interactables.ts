import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Collider, initTransform } from '../components/spatial'
import { IsShrine, IsChest, Interactable } from '../components/upgrades'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

/**
 * Create a shrine at the given world position (on the ground plane).
 * Shrines require the player to stand nearby for `chargeTime` seconds to activate.
 * Returns the new entity id.
 */
export function createShrine(world: GameWorld, x: number, z: number): number {
  const eid = addEntity(world)

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  const shrineTerrainY = sceneManager.getTerrainHeight(x, z)
  initTransform(eid, x, shrineTerrainY + 0.75, z)  // y = terrain + half of cylinder height

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsShrine, eid)

  // ── Collider ──────────────────────────────────────────────────────────
  addComponent(world, Collider, eid)
  Collider.radius[eid] = 0.5
  Collider.halfHeight[eid] = 0.75

  // ── Interactable ────────────────────────────────────────────────────
  addComponent(world, Interactable, eid)
  Interactable.range[eid] = 3
  Interactable.chargeTime[eid] = 5
  Interactable.chargeProgress[eid] = 0
  Interactable.activated[eid] = 0

  // ── Mesh ─────────────────────────────────────────────────────────────
  const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8)
  const material = new THREE.MeshStandardMaterial({
    color: 0x80CBC4,
    emissive: 0x80CBC4,
    emissiveIntensity: 0.3,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, shrineTerrainY + 0.75, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  sceneManager.addMesh(eid, mesh)

  return eid
}

/**
 * Create a chest at the given world position (on the ground plane).
 * Chests are collected instantly when the player walks into range.
 * Returns the new entity id.
 */
export function createChest(world: GameWorld, x: number, z: number): number {
  const eid = addEntity(world)

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  const chestTerrainY = sceneManager.getTerrainHeight(x, z)
  initTransform(eid, x, chestTerrainY + 0.3, z)  // y = terrain + half of box height

  // ── Tags ─────────────────────────────────────────────────────────────
  addComponent(world, IsChest, eid)

  // ── Collider ──────────────────────────────────────────────────────────
  addComponent(world, Collider, eid)
  Collider.radius[eid] = 0.4
  Collider.halfHeight[eid] = 0.3

  // ── Interactable ────────────────────────────────────────────────────
  addComponent(world, Interactable, eid)
  Interactable.range[eid] = 2
  Interactable.chargeTime[eid] = 0
  Interactable.chargeProgress[eid] = 0
  Interactable.activated[eid] = 0

  // ── Mesh ─────────────────────────────────────────────────────────────
  const geometry = new THREE.BoxGeometry(0.8, 0.6, 0.6)
  const material = new THREE.MeshStandardMaterial({
    color: 0xFFD54F,
    emissive: 0xFFD54F,
    emissiveIntensity: 0.2,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, chestTerrainY + 0.3, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  sceneManager.addMesh(eid, mesh)

  return eid
}
