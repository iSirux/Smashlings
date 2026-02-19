import * as THREE from 'three'

// ---- Color palette ----------------------------------------------------------
const COL_GOLD = '#FFD54F'
const COL_WHITE = '#FFFFFF'

// ---- Config -----------------------------------------------------------------
const POOL_SIZE = 50
const LIFETIME = 0.8         // seconds
const TEXT_LIFETIME = 1.8    // seconds — longer for text labels
const FLOAT_SPEED = 80       // px/s upward
const TEXT_FLOAT_SPEED = 40  // px/s — slower for readability
const SPREAD_X = 20          // random horizontal offset range in px

// ---- Types ------------------------------------------------------------------

interface DamageEntry {
  element: HTMLElement
  worldPos: THREE.Vector3
  /** Screen-space X at spawn (pixels). Used by camera-less update(). */
  baseX: number
  /** Screen-space Y at spawn (pixels). Used by camera-less update(). */
  baseY: number
  age: number
  alive: boolean
  velocityX: number          // px/s horizontal drift
  lifetime: number           // per-entry lifetime (seconds)
  floatSpeed: number         // per-entry float speed (px/s)
}

// ---- Helpers ----------------------------------------------------------------

const _projected = new THREE.Vector3()

function worldToScreen(
  pos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
): { x: number; y: number; visible: boolean } {
  _projected.copy(pos)
  _projected.project(camera)

  // Behind the camera
  if (_projected.z > 1) {
    return { x: 0, y: 0, visible: false }
  }

  const x = ((_projected.x + 1) / 2) * width
  const y = ((1 - _projected.y) / 2) * height

  return { x, y, visible: true }
}

// ---- DamageNumbers ----------------------------------------------------------

export class DamageNumbers {
  private container: HTMLElement
  private pool: DamageEntry[] = []

  constructor() {
    // Root container -- covers viewport, no pointer events
    this.container = document.createElement('div')
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '999',
      overflow: 'hidden',
    } satisfies Partial<CSSStyleDeclaration>)

    // Pre-allocate pool
    for (let i = 0; i < POOL_SIZE; i++) {
      const element = document.createElement('div')
      Object.assign(element.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        pointerEvents: 'none',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        fontWeight: '800',
        textShadow: '0 1px 4px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.5)',
        whiteSpace: 'nowrap',
        willChange: 'transform, opacity',
        display: 'none',
      } satisfies Partial<CSSStyleDeclaration>)

      this.container.appendChild(element)

      this.pool.push({
        element,
        worldPos: new THREE.Vector3(),
        baseX: 0,
        baseY: 0,
        age: 0,
        alive: false,
        velocityX: 0,
        lifetime: LIFETIME,
        floatSpeed: FLOAT_SPEED,
      })
    }

    document.body.appendChild(this.container)
  }

  /**
   * Spawn a new floating damage number at the given world position.
   * The 3D position is immediately projected to screen space via the camera.
   */
  spawn(
    x: number,
    y: number,
    z: number,
    amount: number,
    isCrit: boolean,
    camera: THREE.PerspectiveCamera,
  ): void {
    // Find a dead entry in the pool
    let entry: DamageEntry | null = null
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].alive) {
        entry = this.pool[i]
        break
      }
    }

    // If the pool is exhausted, recycle the oldest entry
    if (!entry) {
      let oldest: DamageEntry = this.pool[0]
      for (let i = 1; i < this.pool.length; i++) {
        if (this.pool[i].age > oldest.age) {
          oldest = this.pool[i]
        }
      }
      entry = oldest
    }

    entry.worldPos.set(x, y, z)
    entry.age = 0
    entry.alive = true
    entry.velocityX = (Math.random() - 0.5) * SPREAD_X
    entry.lifetime = LIFETIME
    entry.floatSpeed = FLOAT_SPEED

    const el = entry.element
    el.style.display = 'block'
    el.style.opacity = '1'

    if (isCrit) {
      el.style.fontSize = '28px'
      el.style.color = COL_GOLD
      el.textContent = `${Math.round(amount)}!`
    } else {
      el.style.fontSize = '18px'
      el.style.color = COL_WHITE
      el.textContent = String(Math.round(amount))
    }

    // Project to screen and store base position
    const rect = this.container.getBoundingClientRect()
    const screen = worldToScreen(entry.worldPos, camera, rect.width, rect.height)
    entry.baseX = screen.x
    entry.baseY = screen.y

    if (screen.visible) {
      el.style.transform = `translate(${screen.x}px, ${screen.y}px) translate(-50%, -50%)`
    } else {
      el.style.display = 'none'
      entry.alive = false
    }
  }

  /**
   * Spawn arbitrary floating text at a world position (e.g. shrine bonus labels).
   * Floats upward more slowly and lingers longer than damage numbers.
   */
  spawnText(
    x: number,
    y: number,
    z: number,
    text: string,
    color: string,
    camera: THREE.PerspectiveCamera,
    fontSize = 22,
  ): void {
    // Find a dead entry in the pool
    let entry: DamageEntry | null = null
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].alive) {
        entry = this.pool[i]
        break
      }
    }

    // If the pool is exhausted, recycle the oldest entry
    if (!entry) {
      let oldest: DamageEntry = this.pool[0]
      for (let i = 1; i < this.pool.length; i++) {
        if (this.pool[i].age > oldest.age) {
          oldest = this.pool[i]
        }
      }
      entry = oldest
    }

    entry.worldPos.set(x, y, z)
    entry.age = 0
    entry.alive = true
    entry.velocityX = 0
    entry.lifetime = TEXT_LIFETIME
    entry.floatSpeed = TEXT_FLOAT_SPEED

    const el = entry.element
    el.style.display = 'block'
    el.style.opacity = '1'
    el.style.fontSize = `${fontSize}px`
    el.style.color = color
    el.textContent = text

    // Project to screen and store base position
    const rect = this.container.getBoundingClientRect()
    const screen = worldToScreen(entry.worldPos, camera, rect.width, rect.height)
    entry.baseX = screen.x
    entry.baseY = screen.y

    if (screen.visible) {
      el.style.transform = `translate(${screen.x}px, ${screen.y}px) translate(-50%, -50%)`
    } else {
      el.style.display = 'none'
      entry.alive = false
    }
  }

  /**
   * Tick all active damage numbers without a camera reference.
   * Numbers float upward from their baked screen-space spawn position.
   * This is the standard approach -- call once per frame.
   */
  update(dt: number): void {
    for (let i = 0; i < this.pool.length; i++) {
      const entry = this.pool[i]
      if (!entry.alive) continue

      entry.age += dt

      if (entry.age >= entry.lifetime) {
        entry.alive = false
        entry.element.style.display = 'none'
        continue
      }

      const t = entry.age / entry.lifetime
      const opacity = 1 - t
      const yOffset = -entry.floatSpeed * entry.age
      const xOffset = entry.velocityX * entry.age
      const scale = 1 + (1 - t) * 0.2

      entry.element.style.opacity = String(opacity)
      entry.element.style.transform =
        `translate(${entry.baseX + xOffset}px, ${entry.baseY + yOffset}px) translate(-50%, -50%) scale(${scale})`
    }
  }

  destroy(): void {
    this.container.remove()
  }
}
