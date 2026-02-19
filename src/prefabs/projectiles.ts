import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, initTransform } from '../components/spatial'
import { IsProjectile } from '../components/tags'
import { DamageOnContact } from '../components/combat'
import { Lifetime } from '../components/lifecycle'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

// ── Shared geometry pools (avoid re-creating per projectile) ──────────────

const smallSphereGeo = new THREE.SphereGeometry(0.2, 8, 8)
const tinySphereGeo = new THREE.SphereGeometry(0.15, 8, 8)
const medSphereGeo = new THREE.SphereGeometry(0.3, 8, 8)
// Note: aura/frost pulses create their geometry dynamically based on weapon range

// ── Helper: common projectile setup ──────────────────────────────────────

function setupProjectile(
  world: GameWorld,
  eid: number,
  x: number, y: number, z: number,
  vx: number, vy: number, vz: number,
  damage: number, knockback: number,
  pierce: number, lifetime: number,
): void {
  addComponent(world, Transform, eid)
  initTransform(eid, x, y, z)

  addComponent(world, Velocity, eid)
  Velocity.x[eid] = vx
  Velocity.y[eid] = vy
  Velocity.z[eid] = vz

  addComponent(world, IsProjectile, eid)

  addComponent(world, DamageOnContact, eid)
  DamageOnContact.amount[eid] = damage
  DamageOnContact.knockback[eid] = knockback
  DamageOnContact.pierce[eid] = pierce
  DamageOnContact.hitCount[eid] = 0

  addComponent(world, Lifetime, eid)
  Lifetime.remaining[eid] = lifetime
}

// ── Sword Slash ──────────────────────────────────────────────────────────

const swordBoxGeo = new THREE.BoxGeometry(1.5, 0.3, 0.5)
const swordMat = new THREE.MeshBasicMaterial({ color: 0xFFF176 })

export function createSwordSlash(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
): number {
  const eid = addEntity(world)
  const speed = 12

  setupProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, knockback, 3, 0.15)

  Transform.scaleX[eid] = 1.5
  Transform.scaleY[eid] = 0.3
  Transform.scaleZ[eid] = 0.5
  Transform.rotY[eid] = Math.atan2(dirX, dirZ)

  const mesh = new THREE.Mesh(swordBoxGeo, swordMat)
  mesh.position.set(x, y, z)
  mesh.rotation.y = Math.atan2(dirX, dirZ)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Arrow (Bow) ──────────────────────────────────────────────────────────

const arrowMat = new THREE.MeshBasicMaterial({ color: 0xFFF176 })

export function createArrow(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
): number {
  const eid = addEntity(world)
  const speed = 25

  setupProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, knockback, 2, 2.0)

  const mesh = new THREE.Mesh(smallSphereGeo, arrowMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Bullet (Revolver) ────────────────────────────────────────────────────

const bulletMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF })

export function createBullet(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
): number {
  const eid = addEntity(world)
  const speed = 30

  setupProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, knockback, 1, 1.5)

  const mesh = new THREE.Mesh(tinySphereGeo, bulletMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Bone (Bone Toss) ─────────────────────────────────────────────────────

const boneBoxGeo = new THREE.BoxGeometry(0.3, 0.3, 0.6)
const boneMat = new THREE.MeshBasicMaterial({ color: 0xFAFAFA })

export function createBone(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
): number {
  const eid = addEntity(world)
  const speed = 15

  setupProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, knockback, 1, 1.5)

  const mesh = new THREE.Mesh(boneBoxGeo, boneMat)
  mesh.position.set(x, y, z)
  mesh.rotation.y = Math.atan2(dirX, dirZ)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Katana Slash ─────────────────────────────────────────────────────────

const katanaBoxGeo = new THREE.BoxGeometry(1.0, 0.2, 0.3)
const katanaMat = new THREE.MeshBasicMaterial({ color: 0x80DEEA })

export function createKatanaSlash(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
): number {
  const eid = addEntity(world)
  const speed = 14

  setupProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, knockback, 2, 0.1)

  Transform.scaleX[eid] = 1.0
  Transform.scaleY[eid] = 0.2
  Transform.scaleZ[eid] = 0.3
  Transform.rotY[eid] = Math.atan2(dirX, dirZ)

  const mesh = new THREE.Mesh(katanaBoxGeo, katanaMat)
  mesh.position.set(x, y, z)
  mesh.rotation.y = Math.atan2(dirX, dirZ)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Lightning Bolt (Lightning Staff) ─────────────────────────────────────

const lightningMat = new THREE.MeshBasicMaterial({ color: 0xFFEB3B })

export function createLightningBolt(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
): number {
  const eid = addEntity(world)
  const speed = 20

  setupProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, knockback, 3, 1.0)

  const mesh = new THREE.Mesh(medSphereGeo, lightningMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Fire Trail (Flamewalker) ─────────────────────────────────────────────

const fireTrailGeo = new THREE.SphereGeometry(0.5, 8, 8)
const fireMat = new THREE.MeshBasicMaterial({ color: 0xFF5722 })

export function createFireTrail(
  world: GameWorld,
  x: number, y: number, z: number,
  damage: number,
): number {
  const eid = addEntity(world)

  setupProjectile(world, eid, x, y, z,
    0, 0, 0,
    damage, 0, 255, 2.0)

  const mesh = new THREE.Mesh(fireTrailGeo, fireMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Pellet (Shotgun) ─────────────────────────────────────────────────────

const pelletMat = new THREE.MeshBasicMaterial({ color: 0xFFF176 })

export function createPellet(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
): number {
  const eid = addEntity(world)
  const speed = 20

  setupProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, knockback, 1, 0.8)

  const mesh = new THREE.Mesh(tinySphereGeo, pelletMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Boomerang ────────────────────────────────────────────────────────────

const boomerangGeo = new THREE.SphereGeometry(0.4, 8, 8)
const boomerangMat = new THREE.MeshBasicMaterial({ color: 0x76FF03 })

export function createBoomerangProjectile(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
): number {
  const eid = addEntity(world)
  const speed = 15

  setupProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, knockback, 5, 1.5)

  const mesh = new THREE.Mesh(boomerangGeo, boomerangMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Aura Pulse ───────────────────────────────────────────────────────────

const auraMat = new THREE.MeshBasicMaterial({
  color: 0xCE93D8,
  transparent: true,
  opacity: 0.3,
})

export function createAuraPulse(
  world: GameWorld,
  x: number, y: number, z: number,
  damage: number, size: number,
): number {
  const eid = addEntity(world)

  setupProjectile(world, eid, x, y, z,
    0, 0, 0,
    damage, 0.5, 255, 0.3)

  const geo = new THREE.SphereGeometry(size, 8, 8)
  const mesh = new THREE.Mesh(geo, auraMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Frost Pulse (Frostwalker) ────────────────────────────────────────────

const frostMat = new THREE.MeshBasicMaterial({
  color: 0x80D8FF,
  transparent: true,
  opacity: 0.3,
})

export function createFrostPulse(
  world: GameWorld,
  x: number, y: number, z: number,
  damage: number, size: number,
): number {
  const eid = addEntity(world)

  setupProjectile(world, eid, x, y, z,
    0, 0, 0,
    damage, 1.0, 255, 0.5)

  const geo = new THREE.SphereGeometry(size, 8, 8)
  const mesh = new THREE.Mesh(geo, frostMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Dice Projectile ──────────────────────────────────────────────────────

const diceMat = new THREE.MeshBasicMaterial({ color: 0xE040FB })

export function createDiceProjectile(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, knockback: number,
): number {
  const eid = addEntity(world)
  const speed = 18

  // Dice does random damage 1-6 per hit
  const randomDamage = Math.floor(Math.random() * 6) + 1

  setupProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    randomDamage, knockback, 1, 1.5)

  const mesh = new THREE.Mesh(medSphereGeo, diceMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}
