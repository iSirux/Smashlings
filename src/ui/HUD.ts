import type { GameWorld, WeaponSlotData, TomeSlotData } from '../world'
import { Health, AutoAttack } from '../components/combat'
import { WEAPONS } from '../data/weapons'
import { TOMES } from '../data/tomes'
import { MAX_WEAPON_LEVEL, MAX_TOME_LEVEL, WEAPON_DAMAGE_PER_LEVEL, WEAPON_PROJ_MILESTONE, WEAPON_COOLDOWN_MILESTONE, WEAPON_COOLDOWN_REDUCTION, BASE_SPAWN_INTERVAL, MIN_SPAWN_INTERVAL } from '../data/balance'

// ---- Color palette ----------------------------------------------------------
const COL_BG = '#1A1A2E'
const COL_TEXT = '#E0E0E0'
const COL_ACCENT = '#29B6F6'
const COL_HP = '#EF5350'
const COL_XP = '#CE93D8'
const COL_GOLD = '#FFD54F'
const COL_TOME = '#CE93D8'

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

function hexToCSS(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0')
}

// ---- Slot Bar Types ---------------------------------------------------------

interface SlotUI {
  container: HTMLElement
  iconText: HTMLElement
  levelText: HTMLElement
  cooldownOverlay: HTMLElement | null
  tooltip: HTMLElement
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
  private intensityBarInner: HTMLElement

  // Slot bar
  private slotBarContainer: HTMLElement
  private weaponSlotUIs: SlotUI[] = []
  private tomeSlotUIs: SlotUI[] = []

  constructor() {
    // Root container – covers the entire viewport, pointer-events pass through
    this.container = el('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: '999',
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

    // Intensity row
    const intensityRow = el('div', {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    })

    const intensityBarOuter = el('div', {
      width: '200px',
      height: '8px',
      background: '#00000066',
      borderRadius: '3px',
      overflow: 'hidden',
      position: 'relative',
    })

    this.intensityBarInner = el('div', {
      width: '0%',
      height: '100%',
      background: 'linear-gradient(90deg, #FF9800, #F44336)',
      borderRadius: '3px',
      transition: 'width 0.5s ease-out',
    })
    intensityBarOuter.appendChild(this.intensityBarInner)

    const intensityLabel = el('span', {
      fontSize: '11px',
      fontWeight: '600',
      color: '#FF9800',
      whiteSpace: 'nowrap',
    }, 'Intensity')

    intensityRow.appendChild(intensityBarOuter)
    intensityRow.appendChild(intensityLabel)
    topLeft.appendChild(intensityRow)

    // ---- Kills + Gold (below XP in top-left panel) ------------------------
    const statsRow = el('div', {
      display: 'flex',
      gap: '12px',
      marginTop: '2px',
    })

    this.killsText = el('span', {
      fontSize: '13px',
      fontWeight: '600',
      letterSpacing: '0.02em',
    }, 'Kills: 0')

    this.goldText = el('span', {
      fontSize: '13px',
      fontWeight: '600',
      letterSpacing: '0.02em',
      color: COL_GOLD,
    }, 'Gold: 0')

    statsRow.appendChild(this.killsText)
    statsRow.appendChild(this.goldText)
    topLeft.appendChild(statsRow)

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

    // ---- Bottom-center slot bar -------------------------------------------
    this.slotBarContainer = el('div', {
      position: 'absolute',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      ...panelStyle(),
      padding: '6px 10px',
    })
    this.container.appendChild(this.slotBarContainer)

    // Mount
    document.body.appendChild(this.container)
  }

  /**
   * Rebuild the slot bar UI to match current slot counts.
   */
  private rebuildSlotBar(world: GameWorld): void {
    this.slotBarContainer.innerHTML = ''
    this.weaponSlotUIs = []
    this.tomeSlotUIs = []

    // Weapon slots
    for (let i = 0; i < world.player.maxWeaponSlots; i++) {
      const slotUI = this.createSlotElement('weapon', i)
      this.weaponSlotUIs.push(slotUI)
      this.slotBarContainer.appendChild(slotUI.container)
    }

    // Separator
    const sep = el('div', {
      width: '1px',
      height: '40px',
      background: '#555',
      margin: '0 6px',
      flexShrink: '0',
    })
    this.slotBarContainer.appendChild(sep)

    // Tome slots
    for (let i = 0; i < world.player.maxTomeSlots; i++) {
      const slotUI = this.createSlotElement('tome', i)
      this.tomeSlotUIs.push(slotUI)
      this.slotBarContainer.appendChild(slotUI.container)
    }
  }

  private createSlotElement(type: 'weapon' | 'tome', _index: number): SlotUI {
    const container = el('div', {
      width: '48px',
      height: '48px',
      borderRadius: '6px',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'visible',
      border: '1px dashed #555',
      boxSizing: 'border-box',
      pointerEvents: 'auto',
      cursor: 'default',
    })

    const iconText = el('div', {
      fontSize: '18px',
      fontWeight: '800',
      color: '#666',
      textAlign: 'center',
      lineHeight: '1',
      zIndex: '2',
      position: 'relative',
    }, '+')

    const levelText = el('div', {
      position: 'absolute',
      bottom: '1px',
      right: '3px',
      fontSize: '9px',
      fontWeight: '700',
      color: COL_TEXT,
      zIndex: '2',
      textShadow: '0 1px 2px rgba(0,0,0,0.8)',
    })

    // Cooldown overlay (only for weapons) — clock-sweep using conic-gradient
    let cooldownOverlay: HTMLElement | null = null
    if (type === 'weapon') {
      cooldownOverlay = el('div', {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        borderRadius: '6px',
        zIndex: '1',
        pointerEvents: 'none',
        background: 'transparent',
      })
      container.appendChild(cooldownOverlay)
    }

    container.appendChild(iconText)
    container.appendChild(levelText)

    // Tooltip
    const tooltip = el('div', {
      position: 'absolute',
      bottom: '56px',
      left: '50%',
      transform: 'translateX(-50%)',
      minWidth: '180px',
      maxWidth: '240px',
      padding: '8px 10px',
      background: `${COL_BG}ee`,
      borderRadius: '6px',
      border: `1px solid ${COL_ACCENT}66`,
      backdropFilter: 'blur(6px)',
      fontSize: '12px',
      lineHeight: '1.4',
      color: COL_TEXT,
      pointerEvents: 'none',
      zIndex: '300',
      display: 'none',
      whiteSpace: 'pre-line',
      textAlign: 'left',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    })
    container.appendChild(tooltip)

    container.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block'
    })
    container.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none'
    })

    return { container, iconText, levelText, cooldownOverlay, tooltip }
  }

  private updateWeaponSlot(ui: SlotUI, slotData: WeaponSlotData | null): void {
    if (!slotData) {
      // Empty slot
      ui.container.style.border = '1px dashed #555'
      ui.container.style.background = 'transparent'
      ui.iconText.textContent = '+'
      ui.iconText.style.color = '#666'
      ui.levelText.textContent = ''
      if (ui.cooldownOverlay) ui.cooldownOverlay.style.background = 'transparent'
      ui.tooltip.textContent = 'Empty weapon slot'
      return
    }

    const weapon = WEAPONS[slotData.weaponKey]
    if (!weapon) return

    const color = hexToCSS(weapon.meshColor ?? 0xFFFFFF)
    ui.container.style.border = `2px solid ${color}`
    ui.container.style.background = `${color}33`
    ui.iconText.textContent = weapon.name.charAt(0).toUpperCase()
    ui.iconText.style.color = color
    ui.levelText.textContent = `${slotData.level}`

    // Cooldown overlay — clock sweep from 12 o'clock
    if (ui.cooldownOverlay) {
      const timer = AutoAttack.cooldownTimer[slotData.eid]
      const cd = AutoAttack.cooldown[slotData.eid]
      if (cd > 0 && timer > 0) {
        const deg = Math.max(0, Math.min(360, (timer / cd) * 360))
        ui.cooldownOverlay.style.background =
          `conic-gradient(transparent ${360 - deg}deg, rgba(0,0,0,0.55) ${360 - deg}deg)`
      } else {
        ui.cooldownOverlay.style.background = 'transparent'
      }
    }

    // Tooltip content
    const dmg = AutoAttack.damage[slotData.eid].toFixed(1)
    const cd = AutoAttack.cooldown[slotData.eid].toFixed(2)
    const projCount = AutoAttack.projectileCount[slotData.eid]
    const patterns = ['Nearest', 'Forward', 'Radial', 'Spread', 'Orbit', 'Aura', 'Trail', 'Homing']
    const patternName = patterns[AutoAttack.pattern[slotData.eid]] || '?'

    let nextInfo = ''
    if (slotData.level < MAX_WEAPON_LEVEL) {
      const nextLevel = slotData.level + 1
      if ((nextLevel - 1) % WEAPON_PROJ_MILESTONE === 0) {
        nextInfo = `Next: +1 projectile (Lv ${nextLevel})`
      } else if ((nextLevel - 1) % WEAPON_COOLDOWN_MILESTONE === 0) {
        nextInfo = `Next: -${(WEAPON_COOLDOWN_REDUCTION * 100).toFixed(0)}% cooldown (Lv ${nextLevel})`
      } else {
        nextInfo = `Next: +${(WEAPON_DAMAGE_PER_LEVEL * 100).toFixed(0)}% damage`
      }
    } else {
      nextInfo = 'MAX LEVEL'
    }

    ui.tooltip.textContent = `${weapon.name}\nLevel ${slotData.level}/${MAX_WEAPON_LEVEL}\nDamage: ${dmg}  |  CD: ${cd}s\nProjectiles: ${projCount}  |  ${patternName}\n${nextInfo}`
  }

  private updateTomeSlot(ui: SlotUI, slotData: TomeSlotData | null): void {
    if (!slotData) {
      // Empty slot
      ui.container.style.border = '1px dashed #555'
      ui.container.style.background = 'transparent'
      ui.iconText.textContent = '+'
      ui.iconText.style.color = '#666'
      ui.levelText.textContent = ''
      ui.tooltip.textContent = 'Empty tome slot'
      return
    }

    const tome = TOMES.find(t => t.id === slotData.id)
    if (!tome) return

    ui.container.style.border = `2px solid ${COL_TOME}`
    ui.container.style.background = `${COL_TOME}33`
    ui.iconText.textContent = tome.name.charAt(0).toUpperCase()
    ui.iconText.style.color = COL_TOME
    ui.levelText.textContent = `${slotData.level}`

    // Tooltip content
    const totalBonus = tome.isPercent
      ? `+${(tome.perLevel * slotData.level * 100).toFixed(0)}% ${tome.stat}`
      : `+${(tome.perLevel * slotData.level).toFixed(1)} ${tome.stat}`

    const levelInfo = slotData.level < MAX_TOME_LEVEL
      ? `Level ${slotData.level}/${MAX_TOME_LEVEL}`
      : `Level ${slotData.level}/${MAX_TOME_LEVEL} (MAX)`

    ui.tooltip.textContent = `${tome.name}\n${levelInfo}\n${tome.description}\nTotal: ${totalBonus}`
  }

  private lastWeaponSlotCount = -1
  private lastTomeSlotCount = -1

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

    // Intensity
    const elapsed = time.elapsed
    const decayFactor = 1 - Math.min(elapsed / 600, 0.8)
    const spawnInterval = Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL * decayFactor)
    const batchSize = Math.min(8, Math.floor(1 + elapsed / 75))
    const currentRate = batchSize / spawnInterval
    const maxRate = 8 / MIN_SPAWN_INTERVAL
    const intensityPct = Math.max(0, Math.min(100, (currentRate / maxRate) * 100))
    this.intensityBarInner.style.width = `${intensityPct}%`

    // Kills & Gold
    this.killsText.textContent = `Kills: ${player.kills}`
    this.goldText.textContent = `Gold: ${player.gold}`

    // Slot bar: rebuild if slot counts changed
    if (this.lastWeaponSlotCount !== player.maxWeaponSlots || this.lastTomeSlotCount !== player.maxTomeSlots) {
      this.rebuildSlotBar(world)
      this.lastWeaponSlotCount = player.maxWeaponSlots
      this.lastTomeSlotCount = player.maxTomeSlots
    }

    // Update weapon slots
    for (let i = 0; i < this.weaponSlotUIs.length; i++) {
      this.updateWeaponSlot(this.weaponSlotUIs[i], player.weaponSlots[i] ?? null)
    }

    // Update tome slots
    for (let i = 0; i < this.tomeSlotUIs.length; i++) {
      this.updateTomeSlot(this.tomeSlotUIs[i], player.tomeSlots[i] ?? null)
    }
  }

  destroy(): void {
    this.container.remove()
  }
}
