import type { GameWorld } from '../world'
import { Health } from '../components/combat'
import { WEAPONS } from '../data/weapons'

// ---- Color palette ----------------------------------------------------------
const COL_BG = '#1A1A2E'
const COL_TEXT = '#E0E0E0'
const COL_ACCENT = '#29B6F6'
const COL_HP = '#EF5350'
const COL_XP = '#CE93D8'
const COL_GOLD = '#FFD54F'

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

function panelStyle(): Partial<CSSStyleDeclaration> {
  return {
    background: `${COL_BG}cc`,
    borderRadius: '8px',
    padding: '8px 12px',
    backdropFilter: 'blur(4px)',
    border: `1px solid ${COL_ACCENT}44`,
  }
}

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// ---- HUD --------------------------------------------------------------------

export class HUD {
  private container: HTMLElement
  private hpBar: HTMLElement
  private hpText: HTMLElement
  private xpBar: HTMLElement
  private levelText: HTMLElement
  private timerText: HTMLElement
  private killsText: HTMLElement
  private goldText: HTMLElement
  private weaponText: HTMLElement

  constructor() {
    // Root container – covers the entire viewport, pointer-events pass through
    this.container = el('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '100',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      color: COL_TEXT,
      userSelect: 'none',
    })

    // ---- Top-left panel (HP + XP) -----------------------------------------
    const topLeft = el('div', {
      position: 'absolute',
      top: '16px',
      left: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      ...panelStyle(),
    })

    // HP row
    const hpRow = el('div', {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    })

    const hpBarOuter = el('div', {
      width: '200px',
      height: '20px',
      background: '#00000066',
      borderRadius: '4px',
      overflow: 'hidden',
      position: 'relative',
    })

    this.hpBar = el('div', {
      width: '100%',
      height: '100%',
      background: `linear-gradient(180deg, ${COL_HP}, #C62828)`,
      borderRadius: '4px',
      transition: 'width 0.2s ease-out',
    })
    hpBarOuter.appendChild(this.hpBar)

    this.hpText = el('span', {
      fontSize: '14px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }, '\u2665 100/100')

    hpRow.appendChild(hpBarOuter)
    hpRow.appendChild(this.hpText)
    topLeft.appendChild(hpRow)

    // XP row
    const xpRow = el('div', {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    })

    const xpBarOuter = el('div', {
      width: '200px',
      height: '12px',
      background: '#00000066',
      borderRadius: '3px',
      overflow: 'hidden',
      position: 'relative',
    })

    this.xpBar = el('div', {
      width: '0%',
      height: '100%',
      background: `linear-gradient(180deg, ${COL_XP}, #AB47BC)`,
      borderRadius: '3px',
      transition: 'width 0.2s ease-out',
    })
    xpBarOuter.appendChild(this.xpBar)

    this.levelText = el('span', {
      fontSize: '13px',
      fontWeight: '600',
      color: COL_XP,
      whiteSpace: 'nowrap',
    }, 'Lv 1')

    xpRow.appendChild(xpBarOuter)
    xpRow.appendChild(this.levelText)
    topLeft.appendChild(xpRow)

    this.container.appendChild(topLeft)

    // ---- Top-right panel (Timer) ------------------------------------------
    const topRight = el('div', {
      position: 'absolute',
      top: '16px',
      right: '16px',
      ...panelStyle(),
      textAlign: 'center',
    })

    this.timerText = el('div', {
      fontSize: '32px',
      fontWeight: '700',
      letterSpacing: '0.08em',
      fontVariantNumeric: 'tabular-nums',
      color: COL_TEXT,
      textShadow: `0 0 12px ${COL_ACCENT}66`,
    }, '10:00')
    topRight.appendChild(this.timerText)

    this.container.appendChild(topRight)

    // ---- Bottom-left panel (Kills + Gold) ---------------------------------
    const bottomLeft = el('div', {
      position: 'absolute',
      bottom: '16px',
      left: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      ...panelStyle(),
    })

    this.killsText = el('div', {
      fontSize: '15px',
      fontWeight: '600',
      letterSpacing: '0.02em',
    }, 'Kills: 0')

    this.goldText = el('div', {
      fontSize: '15px',
      fontWeight: '600',
      letterSpacing: '0.02em',
      color: COL_GOLD,
    }, 'Gold: 0')

    bottomLeft.appendChild(this.killsText)
    bottomLeft.appendChild(this.goldText)
    this.container.appendChild(bottomLeft)

    // ---- Bottom-right panel (Weapon) --------------------------------------
    const bottomRight = el('div', {
      position: 'absolute',
      bottom: '16px',
      right: '16px',
      ...panelStyle(),
      textAlign: 'right',
    })

    this.weaponText = el('div', {
      fontSize: '15px',
      fontWeight: '600',
      letterSpacing: '0.02em',
      color: COL_ACCENT,
    }, 'Sword')
    bottomRight.appendChild(this.weaponText)

    this.container.appendChild(bottomRight)

    // Mount
    document.body.appendChild(this.container)
  }

  update(world: GameWorld): void {
    const { player, time } = world

    // HP
    const eid = player.eid
    let hpCur = 0
    let hpMax = 1
    if (eid >= 0) {
      hpCur = Health.current[eid] ?? 0
      hpMax = Health.max[eid] || 1
    }
    const hpPct = Math.max(0, Math.min(100, (hpCur / hpMax) * 100))
    this.hpBar.style.width = `${hpPct}%`
    this.hpText.textContent = `\u2665 ${Math.ceil(hpCur)}/${Math.ceil(hpMax)}`

    // XP
    const xpPct = player.xpToNext > 0
      ? Math.max(0, Math.min(100, (player.xp / player.xpToNext) * 100))
      : 0
    this.xpBar.style.width = `${xpPct}%`
    this.levelText.textContent = `Lv ${player.level}`

    // Timer
    this.timerText.textContent = formatTime(time.gameTimer)

    // Kills & Gold
    this.killsText.textContent = `Kills: ${player.kills}`
    this.goldText.textContent = `Gold: ${player.gold}`

    // Weapon
    const weaponDef = WEAPONS[player.weaponId]
    if (weaponDef) {
      this.weaponText.textContent = weaponDef.name
    }
  }

  destroy(): void {
    this.container.remove()
  }
}
