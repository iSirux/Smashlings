import { defineQuery } from 'bitecs'
import type { GameWorld } from '../world'
import { Transform } from '../components/spatial'
import { IsEnemy, IsProjectile, IsXPGem } from '../components/tags'
import { Health, AutoAttack } from '../components/combat'
import { PlayerStats } from '../components/stats'
import { sceneManager } from '../core/SceneManager'

// ---- Queries ----------------------------------------------------------------
const enemyQuery = defineQuery([IsEnemy])
const projectileQuery = defineQuery([IsProjectile])
const xpGemQuery = defineQuery([IsXPGem])

// ---- Color palette ----------------------------------------------------------
const COL_BG = '#1A1A2E'
const COL_ACCENT = '#29B6F6'
const COL_TEXT = '#E0E0E0'
const COL_DIM = '#888'
const COL_BTN = '#2A3A5E'
const COL_BTN_HOVER = '#3A4E7A'

// ---- Helpers ----------------------------------------------------------------
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  styles: Partial<CSSStyleDeclaration> = {},
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  Object.assign(e.style, styles)
  if (text) e.textContent = text
  return e
}

function makeBtn(label: string, onClick: () => void): HTMLElement {
  const btn = el('button', {
    background: COL_BTN,
    color: COL_TEXT,
    border: `1px solid ${COL_ACCENT}66`,
    borderRadius: '4px',
    padding: '3px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    pointerEvents: 'auto',
  }, label)
  btn.addEventListener('mouseenter', () => { btn.style.background = COL_BTN_HOVER })
  btn.addEventListener('mouseleave', () => { btn.style.background = COL_BTN })
  btn.addEventListener('click', onClick)
  return btn
}

// ---- Debug Panel ------------------------------------------------------------

export interface DebugActions {
  skipTime: (seconds: number) => void
  addXP: (amount: number) => void
  addGold: (amount: number) => void
  healPlayer: () => void
  killAllEnemies: () => void
  toggleGodMode: () => void
}

export class DebugPanel {
  private container: HTMLElement
  private statsEl: HTMLElement
  private fpsFrames: number[] = []
  private godMode = false
  private godModeBtn!: HTMLElement

  constructor(private actions: DebugActions) {
    this.container = el('div', {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      background: `${COL_BG}dd`,
      borderRadius: '8px',
      padding: '8px 10px',
      backdropFilter: 'blur(4px)',
      border: `1px solid ${COL_ACCENT}44`,
      pointerEvents: 'none',
      zIndex: '99',
      fontFamily: 'monospace',
      fontSize: '11px',
      color: COL_DIM,
      userSelect: 'none',
      minWidth: '220px',
    })

    // Title
    const title = el('div', {
      fontWeight: '700',
      fontSize: '12px',
      color: COL_ACCENT,
      marginBottom: '2px',
    }, 'DEBUG')
    this.container.appendChild(title)

    // Stats text area
    this.statsEl = el('div', {
      display: 'flex',
      flexDirection: 'column',
      gap: '1px',
      lineHeight: '1.4',
      whiteSpace: 'pre',
    })
    this.container.appendChild(this.statsEl)

    // Buttons row
    const btnRow1 = el('div', {
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap',
      marginTop: '4px',
    })

    btnRow1.appendChild(makeBtn('+30s', () => actions.skipTime(30)))
    btnRow1.appendChild(makeBtn('+60s', () => actions.skipTime(60)))
    btnRow1.appendChild(makeBtn('+XP', () => actions.addXP(50)))
    btnRow1.appendChild(makeBtn('+Gold', () => actions.addGold(500)))

    const btnRow2 = el('div', {
      display: 'flex',
      gap: '4px',
      flexWrap: 'wrap',
      marginTop: '2px',
    })

    btnRow2.appendChild(makeBtn('Heal', () => actions.healPlayer()))
    btnRow2.appendChild(makeBtn('Kill All', () => actions.killAllEnemies()))
    this.godModeBtn = makeBtn('God Mode', () => {
      this.godMode = !this.godMode
      actions.toggleGodMode()
      this.godModeBtn.textContent = this.godMode ? 'God: ON' : 'God Mode'
      this.godModeBtn.style.background = this.godMode ? '#4A1A1A' : COL_BTN
    })
    btnRow2.appendChild(this.godModeBtn)

    this.container.appendChild(btnRow1)
    this.container.appendChild(btnRow2)

    document.body.appendChild(this.container)
  }

  update(world: GameWorld): void {
    // FPS calculation
    const now = performance.now()
    this.fpsFrames.push(now)
    while (this.fpsFrames.length > 0 && this.fpsFrames[0] < now - 1000) {
      this.fpsFrames.shift()
    }
    const fps = this.fpsFrames.length

    const eid = world.player.eid
    const enemies = enemyQuery(world).length
    const projectiles = projectileQuery(world).length
    const gems = xpGemQuery(world).length
    const entities = enemies + projectiles + gems + 1 // +1 for player
    const meshCount = sceneManager.scene.children.length

    // Player position
    const px = eid >= 0 ? Transform.x[eid].toFixed(1) : '?'
    const pz = eid >= 0 ? Transform.z[eid].toFixed(1) : '?'

    // Player stats
    const dmgMult = eid >= 0 ? PlayerStats.damageMult[eid].toFixed(2) : '?'
    const spdMult = eid >= 0 ? PlayerStats.speedMult[eid].toFixed(2) : '?'
    const cdMult = eid >= 0 ? PlayerStats.cooldownMult[eid].toFixed(2) : '?'
    const crit = eid >= 0 ? (PlayerStats.critChance[eid] * 100).toFixed(1) : '?'
    const armor = eid >= 0 ? Health.armor[eid].toFixed(0) : '?'
    const atkDmg = eid >= 0 ? AutoAttack.damage[eid].toFixed(1) : '?'
    const atkCd = eid >= 0 ? AutoAttack.cooldown[eid].toFixed(2) : '?'

    this.statsEl.textContent =
      `FPS: ${fps}  Entities: ${entities}\n` +
      `Enemies: ${enemies}  Projs: ${projectiles}  Gems: ${gems}\n` +
      `Meshes: ${meshCount}\n` +
      `Pos: (${px}, ${pz})\n` +
      `Dmg: ${atkDmg} (x${dmgMult})  CD: ${atkCd}s (x${cdMult})\n` +
      `Spd: x${spdMult}  Crit: ${crit}%  Armor: ${armor}`
  }

  destroy(): void {
    this.container.remove()
  }
}
