import * as THREE from 'three'
import { defineQuery } from 'bitecs'
import { IsEnemy, IsBoss } from '../components/tags'
import { Health } from '../components/combat'
import { EnemyType } from '../components/lifecycle'
import { Transform } from '../components/spatial'
import { ENEMIES } from '../data/enemies'
import type { GameWorld } from '../world'

// ---- Color palette (matches HUD) -------------------------------------------
const COL_BG = '#1A1A2E'
const COL_HP = '#EF5350'
const COL_TEXT = '#E0E0E0'
const COL_ACCENT = '#29B6F6'

// ---- Queries ---------------------------------------------------------------
const enemyQuery = defineQuery([IsEnemy, Health, EnemyType, Transform])
const bossQuery = defineQuery([IsBoss, Health, Transform])

// ---- Helpers ---------------------------------------------------------------
const _projected = new THREE.Vector3()

function worldToScreen(
  pos: THREE.Vector3,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number,
): { x: number; y: number; visible: boolean } {
  _projected.copy(pos)
  _projected.project(camera)

  if (_projected.z > 1) {
    return { x: 0, y: 0, visible: false }
  }

  const x = ((_projected.x + 1) / 2) * width
  const y = ((1 - _projected.y) / 2) * height

  return { x, y, visible: true }
}

// ---- Types -----------------------------------------------------------------
interface MiniBossBar {
  container: HTMLElement
  nameEl: HTMLElement
  barInner: HTMLElement
}

// ---- BossHealthBars --------------------------------------------------------

export class BossHealthBars {
  private root: HTMLElement
  private miniBossMap: Map<number, MiniBossBar> = new Map()

  // Sticky boss bar elements
  private bossContainer: HTMLElement
  private bossNameEl: HTMLElement
  private bossBarInner: HTMLElement
  private bossHpText: HTMLElement

  private _worldPos = new THREE.Vector3()

  constructor() {
    // Root container — covers viewport, no pointer events
    this.root = document.createElement('div')
    Object.assign(this.root.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '998',
      overflow: 'hidden',
    } satisfies Partial<CSSStyleDeclaration>)

    // ── Sticky boss bar (top-center, hidden by default) ──────────────
    this.bossContainer = document.createElement('div')
    Object.assign(this.bossContainer.style, {
      position: 'absolute',
      top: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      background: `${COL_BG}cc`,
      borderRadius: '8px',
      padding: '8px 16px',
      backdropFilter: 'blur(4px)',
      border: `1px solid ${COL_ACCENT}44`,
    } satisfies Partial<CSSStyleDeclaration>)

    this.bossNameEl = document.createElement('div')
    Object.assign(this.bossNameEl.style, {
      fontSize: '16px',
      fontWeight: '700',
      color: COL_TEXT,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      textAlign: 'center',
      textShadow: '0 0 8px rgba(171,71,188,0.6)',
    } satisfies Partial<CSSStyleDeclaration>)
    this.bossContainer.appendChild(this.bossNameEl)

    const bossBarOuter = document.createElement('div')
    Object.assign(bossBarOuter.style, {
      width: '400px',
      height: '20px',
      background: '#00000066',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    } satisfies Partial<CSSStyleDeclaration>)

    this.bossBarInner = document.createElement('div')
    Object.assign(this.bossBarInner.style, {
      width: '100%',
      height: '100%',
      background: `linear-gradient(180deg, ${COL_HP}, #C62828)`,
      borderRadius: '4px',
      transition: 'width 0.15s ease-out',
    } satisfies Partial<CSSStyleDeclaration>)
    bossBarOuter.appendChild(this.bossBarInner)

    this.bossHpText = document.createElement('div')
    Object.assign(this.bossHpText.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: '700',
      color: COL_TEXT,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
    } satisfies Partial<CSSStyleDeclaration>)
    bossBarOuter.appendChild(this.bossHpText)

    this.bossContainer.appendChild(bossBarOuter)
    this.root.appendChild(this.bossContainer)

    document.body.appendChild(this.root)
  }

  update(world: GameWorld, camera: THREE.PerspectiveCamera): void {
    const w = window.innerWidth
    const h = window.innerHeight

    // ── Sticky boss bar ────────────────────────────────────────────────
    const bosses = bossQuery(world)
    if (bosses.length > 0) {
      const beid = bosses[0]
      const def = ENEMIES[EnemyType.id[beid]]
      const cur = Health.current[beid]
      const max = Health.max[beid] || 1
      const pct = Math.max(0, Math.min(100, (cur / max) * 100))

      this.bossContainer.style.display = 'flex'
      this.bossNameEl.textContent = def?.name ?? 'Boss'
      this.bossBarInner.style.width = `${pct}%`
      this.bossHpText.textContent = `${Math.ceil(cur)} / ${Math.ceil(max)}`
    } else {
      this.bossContainer.style.display = 'none'
    }

    // ── Floating mini-boss bars ────────────────────────────────────────
    const enemies = enemyQuery(world)
    const activeEids = new Set<number>()

    for (let i = 0; i < enemies.length; i++) {
      const eid = enemies[i]
      const typeIdx = EnemyType.id[eid]
      const def = ENEMIES[typeIdx]
      if (!def || !def.isMiniBoss) continue

      activeEids.add(eid)

      // Get or create bar
      let bar = this.miniBossMap.get(eid)
      if (!bar) {
        bar = this.createMiniBossBar()
        this.miniBossMap.set(eid, bar)
        this.root.appendChild(bar.container)
      }

      // Update name
      bar.nameEl.textContent = def.name

      // Update HP bar width
      const cur = Health.current[eid]
      const max = Health.max[eid] || 1
      const pct = Math.max(0, Math.min(100, (cur / max) * 100))
      bar.barInner.style.width = `${pct}%`

      // Project world position to screen
      const meshHeight = def.meshScale[1]
      this._worldPos.set(
        Transform.x[eid],
        Transform.y[eid] + meshHeight + 0.5,
        Transform.z[eid],
      )

      const screen = worldToScreen(this._worldPos, camera, w, h)
      if (screen.visible) {
        bar.container.style.display = 'block'
        bar.container.style.transform = `translate(${screen.x}px, ${screen.y}px) translate(-50%, -100%)`
      } else {
        bar.container.style.display = 'none'
      }
    }

    // Remove bars for dead mini-bosses
    for (const [eid, bar] of this.miniBossMap) {
      if (!activeEids.has(eid)) {
        bar.container.remove()
        this.miniBossMap.delete(eid)
      }
    }
  }

  private createMiniBossBar(): MiniBossBar {
    const container = document.createElement('div')
    Object.assign(container.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      display: 'block',
      pointerEvents: 'none',
      textAlign: 'center',
      willChange: 'transform',
    } satisfies Partial<CSSStyleDeclaration>)

    const nameEl = document.createElement('div')
    Object.assign(nameEl.style, {
      fontSize: '12px',
      fontWeight: '700',
      color: COL_TEXT,
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
      marginBottom: '2px',
      whiteSpace: 'nowrap',
    } satisfies Partial<CSSStyleDeclaration>)
    container.appendChild(nameEl)

    const barOuter = document.createElement('div')
    Object.assign(barOuter.style, {
      width: '120px',
      height: '10px',
      background: '#00000088',
      borderRadius: '3px',
      overflow: 'hidden',
      margin: '0 auto',
      border: '1px solid #ffffff33',
    } satisfies Partial<CSSStyleDeclaration>)

    const barInner = document.createElement('div')
    Object.assign(barInner.style, {
      width: '100%',
      height: '100%',
      background: `linear-gradient(180deg, ${COL_HP}, #C62828)`,
      borderRadius: '3px',
      transition: 'width 0.15s ease-out',
    } satisfies Partial<CSSStyleDeclaration>)
    barOuter.appendChild(barInner)
    container.appendChild(barOuter)

    return { container, nameEl, barInner }
  }

  reset(): void {
    for (const [, bar] of this.miniBossMap) {
      bar.container.remove()
    }
    this.miniBossMap.clear()
  }

  destroy(): void {
    this.root.remove()
  }
}
