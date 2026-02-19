import * as THREE from 'three'
import { eventBus } from '../../core/EventBus'
import { sceneManager } from '../../core/SceneManager'

const MAX_PARTICLES = 2000

interface Particle {
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
  life: number
  maxLife: number
  size: number
  color: THREE.Color
  active: boolean
}

export class ParticleManager {
  private particles: Particle[] = []
  private geometry: THREE.BufferGeometry
  private positions: Float32Array
  private colors: Float32Array
  private sizes: Float32Array
  private points: THREE.Points
  private activeCount = 0

  constructor() {
    // Pre-allocate particle pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1, size: 0.3,
        color: new THREE.Color(1, 1, 1),
        active: false,
      })
    }

    this.positions = new Float32Array(MAX_PARTICLES * 3)
    this.colors = new Float32Array(MAX_PARTICLES * 3)
    this.sizes = new Float32Array(MAX_PARTICLES)

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.points = new THREE.Points(this.geometry, material)
    this.points.frustumCulled = false
    sceneManager.scene.add(this.points)

    // Subscribe to game events
    eventBus.on('entity:damaged', (data) => {
      this.spawnBurst(data.x, data.y, data.z, 5, data.isCrit ? 0xFFD54F : 0xFF5722, data.isCrit ? 0.4 : 0.2)
    })

    eventBus.on('entity:died', (data) => {
      if (data.wasEnemy) {
        this.spawnBurst(data.x, data.y, data.z, 15, 0xCE93D8, 0.3) // purple death burst
      }
    })

    eventBus.on('player:levelup', () => {
      // Level-up ring effect - deferred until next update when we have player position
      this.levelUpPending = true
    })
  }

  private levelUpPending = false

  spawnBurst(x: number, y: number, z: number, count: number, color: number, size: number): void {
    const c = new THREE.Color(color)
    for (let i = 0; i < count; i++) {
      const p = this.getInactiveParticle()
      if (!p) break

      p.x = x + (Math.random() - 0.5) * 0.5
      p.y = y + (Math.random() - 0.5) * 0.5
      p.z = z + (Math.random() - 0.5) * 0.5
      p.vx = (Math.random() - 0.5) * 5
      p.vy = 2 + Math.random() * 3
      p.vz = (Math.random() - 0.5) * 5
      p.life = 0
      p.maxLife = 0.5 + Math.random() * 0.5
      p.size = size
      p.color.copy(c)
      p.active = true
    }
  }

  spawnRing(x: number, y: number, z: number, count: number, radius: number, color: number): void {
    const c = new THREE.Color(color)
    for (let i = 0; i < count; i++) {
      const p = this.getInactiveParticle()
      if (!p) break

      const angle = (i / count) * Math.PI * 2
      p.x = x + Math.cos(angle) * radius
      p.y = y + 0.5
      p.z = z + Math.sin(angle) * radius
      p.vx = Math.cos(angle) * 3
      p.vy = 2 + Math.random()
      p.vz = Math.sin(angle) * 3
      p.life = 0
      p.maxLife = 0.8
      p.size = 0.4
      p.color.copy(c)
      p.active = true
    }
  }

  update(dt: number, playerX: number, playerY: number, playerZ: number): void {
    if (this.levelUpPending) {
      this.spawnRing(playerX, playerY, playerZ, 30, 2, 0xFFD54F) // gold ring
      this.levelUpPending = false
    }

    this.activeCount = 0

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      if (!p.active) continue

      p.life += dt
      if (p.life >= p.maxLife) {
        p.active = false
        continue
      }

      // Physics
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      p.vy -= 5 * dt // gravity

      // Fade
      const t = p.life / p.maxLife
      const alpha = 1 - t

      const idx = this.activeCount
      this.positions[idx * 3] = p.x
      this.positions[idx * 3 + 1] = p.y
      this.positions[idx * 3 + 2] = p.z
      this.colors[idx * 3] = p.color.r * alpha
      this.colors[idx * 3 + 1] = p.color.g * alpha
      this.colors[idx * 3 + 2] = p.color.b * alpha
      this.sizes[idx] = p.size * (1 - t * 0.5)

      this.activeCount++
    }

    // Update geometry
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
    this.geometry.attributes.size.needsUpdate = true
    this.geometry.setDrawRange(0, this.activeCount)
  }

  private getInactiveParticle(): Particle | null {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) return this.particles[i]
    }
    return null
  }

  dispose(): void {
    sceneManager.scene.remove(this.points)
    this.geometry.dispose()
    ;(this.points.material as THREE.Material).dispose()
  }
}
