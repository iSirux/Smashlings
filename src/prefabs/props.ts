import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, initTransform } from '../components/spatial'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

/** Module-level portal eid tracker. -1 means no active portal. */
let portalEid = -1

/**
 * Create a boss portal entity at the given XZ position.
 * The portal is a glowing teal cylinder that serves as the trigger
 * for boss spawning when the player gets close.
 * Returns the new entity id.
 */
export function createBossPortal(world: GameWorld, x: number, z: number): number {
  const eid = addEntity(world)

  // ── Spatial ──────────────────────────────────────────────────────────
  addComponent(world, Transform, eid)
  initTransform(eid, x, 1.5, z) // y = half height of cylinder

  // ── Mesh ─────────────────────────────────────────────────────────────
  const geometry = new THREE.CylinderGeometry(1, 1, 3, 16)
  const material = new THREE.MeshStandardMaterial({
    color: 0x80CBC4,
    emissive: 0x80CBC4,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.7,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(x, 1.5, z)
  sceneManager.addMesh(eid, mesh)

  portalEid = eid
  return eid
}

/** Get the current portal eid (-1 if none). */
export function getPortalEid(): number {
  return portalEid
}

/** Reset the portal tracker. */
export function resetPortal(): void {
  portalEid = -1
}
