import * as THREE from 'three'
import { addEntity, addComponent } from 'bitecs'
import { Transform, Velocity, initTransform } from '../components/spatial'
import { IsEnemyProjectile } from '../components/tags'
import { DamageOnContact, EnemyHoming } from '../components/combat'
import { Lifetime } from '../components/lifecycle'
import { sceneManager } from '../core/SceneManager'
import type { GameWorld } from '../world'

// ── Shared geometry pools ────────────────────────────────────────────────

const smallSphereGeo = new THREE.SphereGeometry(0.2, 8, 8)
const medSphereGeo = new THREE.SphereGeometry(0.3, 8, 8)
const largeSphereGeo = new THREE.SphereGeometry(1.5, 10, 10)

// ── Materials ────────────────────────────────────────────────────────────

const redMat = new THREE.MeshBasicMaterial({ color: 0xFF4444 })
const homingMat = new THREE.MeshBasicMaterial({ color: 0xCCCCDD })
const poisonMat = new THREE.MeshBasicMaterial({
  color: 0x66BB6A,
  transparent: true,
  opacity: 0.4,
})
const bossAoeMat = new THREE.MeshBasicMaterial({
  color: 0xFF7043,
  transparent: true,
  opacity: 0.35,
})

// ── Helper: common enemy projectile setup ────────────────────────────────

function setupEnemyProjectile(
  world: GameWorld,
  eid: number,
  x: number, y: number, z: number,
  vx: number, vy: number, vz: number,
  damage: number, pierce: number, lifetime: number,
): void {
  addComponent(world, Transform, eid)
  initTransform(eid, x, y, z)

  addComponent(world, Velocity, eid)
  Velocity.x[eid] = vx
  Velocity.y[eid] = vy
  Velocity.z[eid] = vz

  addComponent(world, IsEnemyProjectile, eid)

  addComponent(world, DamageOnContact, eid)
  DamageOnContact.amount[eid] = damage
  DamageOnContact.knockback[eid] = 0
  DamageOnContact.pierce[eid] = pierce
  DamageOnContact.hitCount[eid] = 0

  addComponent(world, Lifetime, eid)
  Lifetime.remaining[eid] = lifetime
}

// ── Straight Enemy Projectile ────────────────────────────────────────────

export function createEnemyProjectile(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, speed: number,
  color?: number,
): number {
  const eid = addEntity(world)

  setupEnemyProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, 1, 3.0)

  const mat = color != null
    ? new THREE.MeshBasicMaterial({ color })
    : redMat
  const mesh = new THREE.Mesh(smallSphereGeo, mat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Homing Enemy Projectile ──────────────────────────────────────────────

export function createEnemyHomingProjectile(
  world: GameWorld,
  x: number, y: number, z: number,
  dirX: number, dirZ: number,
  damage: number, speed: number,
): number {
  const eid = addEntity(world)

  setupEnemyProjectile(world, eid, x, y, z,
    dirX * speed, 0, dirZ * speed,
    damage, 1, 5.0)

  addComponent(world, EnemyHoming, eid)
  EnemyHoming.turnRate[eid] = 2.0 // radians/sec — dodgeable

  const mesh = new THREE.Mesh(medSphereGeo, homingMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Poison Cloud (AoE) ──────────────────────────────────────────────────

export function createPoisonCloud(
  world: GameWorld,
  x: number, y: number, z: number,
  damage: number,
): number {
  const eid = addEntity(world)

  // Stationary, high pierce, 3 second duration
  setupEnemyProjectile(world, eid, x, y, z,
    0, 0, 0,
    damage, 255, 3.0)

  const mesh = new THREE.Mesh(largeSphereGeo, poisonMat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}

// ── Boss AoE (expanding ring / slam) ────────────────────────────────────

export function createBossAoE(
  world: GameWorld,
  x: number, y: number, z: number,
  damage: number, radius: number,
  color?: number,
): number {
  const eid = addEntity(world)

  // Stationary, high pierce, short duration
  setupEnemyProjectile(world, eid, x, y, z,
    0, 0, 0,
    damage, 255, 1.0)

  const geo = new THREE.SphereGeometry(radius, 10, 10)
  const mat = color != null
    ? new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 })
    : bossAoeMat
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(x, y, z)
  sceneManager.addMesh(eid, mesh)

  return eid
}
