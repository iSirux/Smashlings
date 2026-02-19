import { defineQuery, hasComponent } from 'bitecs'
import { Transform } from '../components/spatial'
import { IsEnemy, IsBoss, IsXPGem } from '../components/tags'
import { IsShrine, IsChest, IsGoldCoin, Interactable } from '../components/upgrades'
import { EnemyType } from '../components/lifecycle'
import { ENEMIES } from '../data/enemies'
import { getPortalEid } from '../prefabs/props'
import { getCameraYaw } from '../systems/rendering/CameraSystem'
import type { GameWorld } from '../world'

// ---- Queries (module-level) -------------------------------------------------
const enemyQuery = defineQuery([IsEnemy, Transform])
const xpGemQuery = defineQuery([IsXPGem, Transform])
const goldCoinQuery = defineQuery([IsGoldCoin, Transform])
const shrineQuery = defineQuery([IsShrine, Transform])
const chestQuery = defineQuery([IsChest, Transform])

// ---- Constants --------------------------------------------------------------
const SIZE = 180             // diameter in CSS pixels
const WORLD_RADIUS = 80      // world units visible from player center
const HALF = SIZE / 2
const MAP_BOUNDS = 500        // terrain boundary side length (world units)

// Colors
const COL_BG = '#0D1117'
const COL_BORDER = '#29B6F6'
const COL_PLAYER = '#29B6F6'
const COL_ENEMY = '#EF5350'
const COL_MINIBOSS = '#FF7043'
const COL_BOSS = '#AB47BC'
const COL_XP = '#66BB6A'
const COL_GOLD = '#FFD54F'
const COL_SHRINE = '#80CBC4'
const COL_CHEST = '#FFD54F'
const COL_PORTAL = '#80CBC4'
const COL_TERRAIN = '#1A3320'

export class Minimap {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private dpr: number
  private wrapper: HTMLElement

  // Updated each frame for camera-relative rotation
  private sinYaw = 0
  private cosYaw = 1

  constructor() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)

    // Wrapper div
    this.wrapper = document.createElement('div')
    Object.assign(this.wrapper.style, {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      width: `${SIZE}px`,
      height: `${SIZE}px`,
      pointerEvents: 'none',
      zIndex: '999',
      borderRadius: '50%',
      overflow: 'hidden',
    } as Partial<CSSStyleDeclaration>)

    // Canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = SIZE * this.dpr
    this.canvas.height = SIZE * this.dpr
    this.canvas.style.width = `${SIZE}px`
    this.canvas.style.height = `${SIZE}px`
    this.ctx = this.canvas.getContext('2d')!
    this.wrapper.appendChild(this.canvas)

    document.body.appendChild(this.wrapper)
  }

  /**
   * Convert world offset (relative to player) to canvas pixel coords.
   * Applies camera-yaw rotation so "up" on the minimap = camera forward.
   */
  private toCanvas(dx: number, dz: number): [number, number] {
    // Rotate by +cameraYaw so camera forward maps to canvas -Y (up)
    const rx = dx * this.cosYaw - dz * this.sinYaw
    const rz = dx * this.sinYaw + dz * this.cosYaw
    const scale = HALF / WORLD_RADIUS * this.dpr
    return [
      HALF * this.dpr + rx * scale,
      HALF * this.dpr + rz * scale,
    ]
  }

  update(world: GameWorld): void {
    const ctx = this.ctx
    const d = this.dpr
    const w = SIZE * d
    const half = HALF * d

    const playerEid = world.player.eid
    if (playerEid < 0) return

    const px = Transform.x[playerEid]
    const pz = Transform.z[playerEid]
    const radiusSq = WORLD_RADIUS * WORLD_RADIUS

    // Pre-compute camera rotation for this frame
    const yaw = getCameraYaw()
    this.sinYaw = Math.sin(yaw)
    this.cosYaw = Math.cos(yaw)

    // ---- Clear + circular clip + background ---------------------------------
    ctx.clearRect(0, 0, w, w)
    ctx.save()
    ctx.beginPath()
    ctx.arc(half, half, half, 0, Math.PI * 2)
    ctx.clip()

    // Dark background
    ctx.fillStyle = COL_BG
    ctx.fillRect(0, 0, w, w)

    // ---- Terrain boundary (rotated rect) ------------------------------------
    {
      const hb = MAP_BOUNDS / 2
      // Four corners relative to player, then rotate via toCanvas
      const [x0, y0] = this.toCanvas(-hb - px, -hb - pz)
      const [x1, y1] = this.toCanvas( hb - px, -hb - pz)
      const [x2, y2] = this.toCanvas( hb - px,  hb - pz)
      const [x3, y3] = this.toCanvas(-hb - px,  hb - pz)
      ctx.strokeStyle = COL_TERRAIN
      ctx.lineWidth = 1 * d
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.lineTo(x3, y3)
      ctx.closePath()
      ctx.stroke()
    }

    // ---- XP gems (green tiny dots) ------------------------------------------
    ctx.fillStyle = COL_XP
    const xpEnts = xpGemQuery(world)
    for (let i = 0; i < xpEnts.length; i++) {
      const eid = xpEnts[i]
      const dx = Transform.x[eid] - px
      const dz = Transform.z[eid] - pz
      if (dx * dx + dz * dz > radiusSq) continue
      const [cx, cz] = this.toCanvas(dx, dz)
      const s = 1.5 * d
      ctx.fillRect(cx - s, cz - s, s * 2, s * 2)
    }

    // ---- Gold coins (yellow tiny dots) --------------------------------------
    ctx.fillStyle = COL_GOLD
    const goldEnts = goldCoinQuery(world)
    for (let i = 0; i < goldEnts.length; i++) {
      const eid = goldEnts[i]
      const dx = Transform.x[eid] - px
      const dz = Transform.z[eid] - pz
      if (dx * dx + dz * dz > radiusSq) continue
      const [cx, cz] = this.toCanvas(dx, dz)
      const s = 1.5 * d
      ctx.fillRect(cx - s, cz - s, s * 2, s * 2)
    }

    // ---- Enemies (split into regular / miniboss / boss) ---------------------
    const enemyEnts = enemyQuery(world)
    // Regular enemies first (batch red)
    ctx.fillStyle = COL_ENEMY
    for (let i = 0; i < enemyEnts.length; i++) {
      const eid = enemyEnts[i]
      const def = ENEMIES[EnemyType.id[eid]]
      if (def && (def.isMiniBoss || def.isBoss)) continue
      if (hasComponent(world, IsBoss, eid)) continue
      const dx = Transform.x[eid] - px
      const dz = Transform.z[eid] - pz
      if (dx * dx + dz * dz > radiusSq) continue
      const [cx, cz] = this.toCanvas(dx, dz)
      const s = 2.5 * d
      ctx.fillRect(cx - s, cz - s, s * 2, s * 2)
    }

    // Mini-bosses (orange circles)
    ctx.fillStyle = COL_MINIBOSS
    for (let i = 0; i < enemyEnts.length; i++) {
      const eid = enemyEnts[i]
      const def = ENEMIES[EnemyType.id[eid]]
      if (!def || !def.isMiniBoss) continue
      const dx = Transform.x[eid] - px
      const dz = Transform.z[eid] - pz
      if (dx * dx + dz * dz > radiusSq) continue
      const [cx, cz] = this.toCanvas(dx, dz)
      ctx.beginPath()
      ctx.arc(cx, cz, 4 * d, 0, Math.PI * 2)
      ctx.fill()
    }

    // Bosses (purple circles)
    ctx.fillStyle = COL_BOSS
    for (let i = 0; i < enemyEnts.length; i++) {
      const eid = enemyEnts[i]
      if (!hasComponent(world, IsBoss, eid)) continue
      const dx = Transform.x[eid] - px
      const dz = Transform.z[eid] - pz
      if (dx * dx + dz * dz > radiusSq) continue
      const [cx, cz] = this.toCanvas(dx, dz)
      ctx.beginPath()
      ctx.arc(cx, cz, 6 * d, 0, Math.PI * 2)
      ctx.fill()
    }

    // ---- Shrines (teal circles, dimmed if activated) ------------------------
    const shrineEnts = shrineQuery(world)
    for (let i = 0; i < shrineEnts.length; i++) {
      const eid = shrineEnts[i]
      const dx = Transform.x[eid] - px
      const dz = Transform.z[eid] - pz
      if (dx * dx + dz * dz > radiusSq) continue
      const activated = Interactable.activated[eid] === 1
      ctx.fillStyle = activated ? '#40655F' : COL_SHRINE
      const [cx, cz] = this.toCanvas(dx, dz)
      ctx.beginPath()
      ctx.arc(cx, cz, 3.5 * d, 0, Math.PI * 2)
      ctx.fill()
    }

    // ---- Chests (gold squares, dimmed if activated) -------------------------
    const chestEnts = chestQuery(world)
    for (let i = 0; i < chestEnts.length; i++) {
      const eid = chestEnts[i]
      const dx = Transform.x[eid] - px
      const dz = Transform.z[eid] - pz
      if (dx * dx + dz * dz > radiusSq) continue
      const activated = Interactable.activated[eid] === 1
      ctx.fillStyle = activated ? '#7F6A27' : COL_CHEST
      const [cx, cz] = this.toCanvas(dx, dz)
      const s = 3 * d
      ctx.fillRect(cx - s, cz - s, s * 2, s * 2)
    }

    // ---- Boss portal (teal diamond) -----------------------------------------
    const portalEid = getPortalEid()
    if (portalEid >= 0) {
      const dx = Transform.x[portalEid] - px
      const dz = Transform.z[portalEid] - pz
      if (dx * dx + dz * dz <= radiusSq) {
        const [cx, cz] = this.toCanvas(dx, dz)
        const s = 5 * d
        ctx.fillStyle = COL_PORTAL
        ctx.beginPath()
        ctx.moveTo(cx, cz - s)
        ctx.lineTo(cx + s, cz)
        ctx.lineTo(cx, cz + s)
        ctx.lineTo(cx - s, cz)
        ctx.closePath()
        ctx.fill()
      }
    }

    // ---- Player dot + direction triangle ------------------------------------
    {
      // Center dot
      ctx.fillStyle = COL_PLAYER
      ctx.beginPath()
      ctx.arc(half, half, 5 * d, 0, Math.PI * 2)
      ctx.fill()

      // Direction triangle — relative to camera yaw so it shows player facing
      // rot=0 → player faces same as camera → arrow points up (canvas -Y)
      const rot = Transform.rotY[playerEid] - yaw
      const triDist = 9 * d
      const triSize = 4 * d
      // Canvas direction vector: sin(rot) → right, -cos(rot) → up
      const cdx = Math.sin(rot)
      const cdy = -Math.cos(rot)
      const tipX = half + cdx * triDist
      const tipY = half + cdy * triDist
      // Perpendicular (90° clockwise on canvas)
      const perpX = -cdy
      const perpY = cdx
      ctx.beginPath()
      ctx.moveTo(tipX, tipY)
      ctx.lineTo(tipX - cdx * triSize + perpX * triSize * 0.6, tipY - cdy * triSize + perpY * triSize * 0.6)
      ctx.lineTo(tipX - cdx * triSize - perpX * triSize * 0.6, tipY - cdy * triSize - perpY * triSize * 0.6)
      ctx.closePath()
      ctx.fill()
    }

    // ---- Restore clip + draw border ring ------------------------------------
    ctx.restore()

    ctx.strokeStyle = COL_BORDER
    ctx.lineWidth = 2 * d
    ctx.beginPath()
    ctx.arc(half, half, half - 1 * d, 0, Math.PI * 2)
    ctx.stroke()
  }

  destroy(): void {
    this.wrapper.remove()
  }
}
