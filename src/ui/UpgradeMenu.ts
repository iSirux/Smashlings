import type { LevelUpChoice } from '../main'
import type { TomeDef } from '../data/tomes'
import { WEAPONS } from '../data/weapons'
import { TOMES } from '../data/tomes'
import { AutoAttack } from '../components/combat'
import {
  MAX_WEAPON_LEVEL,
  MAX_TOME_LEVEL,
  WEAPON_DAMAGE_PER_LEVEL,
  WEAPON_PROJ_MILESTONE,
  WEAPON_COOLDOWN_MILESTONE,
  WEAPON_COOLDOWN_REDUCTION,
} from '../data/balance'

// ---- Color palette ----------------------------------------------------------
const COL_BG = '#1A1A2E'
const COL_TEXT = '#E0E0E0'
const COL_ACCENT = '#29B6F6'
const COL_GOLD = '#FFD54F'
const COL_WEAPON = '#FF9800'
const COL_NEW = '#66BB6A'
const COL_TOME = '#CE93D8'

// ---- Keyframe injection (once) ----------------------------------------------
let stylesInjected = false

function injectKeyframes(): void {
  if (stylesInjected) return
  stylesInjected = true

  const sheet = document.createElement('style')
  sheet.textContent = `
    @keyframes smash-levelup-bounce {
      0%   { transform: scale(0.4); opacity: 0; }
      50%  { transform: scale(1.15); opacity: 1; }
      70%  { transform: scale(0.95); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes smash-card-enter {
      0%   { transform: translateY(40px) scale(0.9); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    @keyframes smash-overlay-fade {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
  `
  document.head.appendChild(sheet)
}

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

function hexToCSS(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0')
}

// ---- UpgradeMenu ------------------------------------------------------------

export class UpgradeMenu {
  private overlay: HTMLElement
  private cardContainer: HTMLElement
  private title: HTMLElement
  private cards: HTMLElement[] = []
  private visible: boolean = false
  private onSelect: ((choice: LevelUpChoice) => void) | null = null

  constructor() {
    injectKeyframes()

    // Full-screen overlay
    this.overlay = el('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '999',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      color: COL_TEXT,
      userSelect: 'none',
    })

    // Title
    this.title = el('div', {
      fontSize: '56px',
      fontWeight: '900',
      color: COL_GOLD,
      textShadow: `0 0 20px ${COL_GOLD}88, 0 2px 8px rgba(0,0,0,0.6)`,
      marginBottom: '40px',
      letterSpacing: '0.08em',
    }, 'LEVEL UP!')
    this.overlay.appendChild(this.title)

    // Card row container
    this.cardContainer = el('div', {
      display: 'flex',
      gap: '24px',
      alignItems: 'center',
      justifyContent: 'center',
    })
    this.overlay.appendChild(this.cardContainer)

    document.body.appendChild(this.overlay)
  }

  show(choices: LevelUpChoice[], onSelect: (choice: LevelUpChoice) => void): void {
    this.onSelect = onSelect
    this.visible = true

    // Clear previous cards
    this.cardContainer.innerHTML = ''
    this.cards = []

    // Animate overlay in
    this.overlay.style.display = 'flex'
    this.overlay.style.animation = 'smash-overlay-fade 0.3s ease-out forwards'

    // Animate title
    this.title.style.animation = 'smash-levelup-bounce 0.6s ease-out forwards'

    // Build cards
    choices.forEach((choice, index) => {
      const card = this.createChoiceCard(choice, index)
      this.cardContainer.appendChild(card)
      this.cards.push(card)
    })
  }

  hide(): void {
    this.visible = false
    this.onSelect = null
    this.overlay.style.display = 'none'
    this.cardContainer.innerHTML = ''
    this.cards = []
  }

  destroy(): void {
    this.overlay.remove()
  }

  // ---- Private helpers ----------------------------------------------------

  private createChoiceCard(choice: LevelUpChoice, index: number): HTMLElement {
    switch (choice.type) {
      case 'weapon_upgrade': return this.createWeaponUpgradeCard(choice, index)
      case 'new_weapon': return this.createNewWeaponCard(choice, index)
      case 'tome_upgrade': return this.createTomeUpgradeCard(choice, index)
      case 'new_tome': return this.createNewTomeCard(choice, index)
    }
  }

  private makeBaseCard(borderColor: string, index: number): HTMLElement {
    const card = el('div', {
      width: '200px',
      height: '280px',
      background: `${COL_BG}ee`,
      border: `2px solid ${borderColor}`,
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      cursor: 'pointer',
      boxSizing: 'border-box',
      transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      pointerEvents: 'auto',
      animation: `smash-card-enter 0.4s ease-out ${index * 0.1}s both`,
      boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
      position: 'relative',
    })

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.06)'
      card.style.boxShadow = `0 0 24px ${borderColor}66, 0 8px 32px rgba(0,0,0,0.5)`
    })
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)'
      card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'
    })

    return card
  }

  private addNewBadge(card: HTMLElement): void {
    const badge = el('div', {
      position: 'absolute',
      top: '8px',
      right: '8px',
      padding: '2px 8px',
      background: COL_NEW,
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: '800',
      color: '#FFF',
      letterSpacing: '0.05em',
    }, 'NEW')
    card.appendChild(badge)
  }

  private makeIcon(letter: string, color: string): HTMLElement {
    return el('div', {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${color}44, ${color}22)`,
      border: `2px solid ${color}88`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: '800',
      color,
      marginBottom: '16px',
      flexShrink: '0',
    }, letter)
  }

  private bindClick(card: HTMLElement, choice: LevelUpChoice): void {
    card.addEventListener('click', () => {
      if (this.onSelect) {
        this.onSelect(choice)
      }
      this.hide()
    })
  }

  // ── Weapon Upgrade Card ───────────────────────────────────────────────

  private createWeaponUpgradeCard(choice: Extract<LevelUpChoice, { type: 'weapon_upgrade' }>, index: number): HTMLElement {
    const weapon = WEAPONS[choice.weaponKey]
    if (!weapon) return this.makeBaseCard(COL_WEAPON, index)

    const weaponColor = hexToCSS(weapon.meshColor ?? 0xFF9800)
    const card = this.makeBaseCard(weaponColor, index)

    card.appendChild(this.makeIcon(weapon.name.charAt(0).toUpperCase(), weaponColor))

    const name = el('div', {
      fontSize: '17px',
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: '6px',
      lineHeight: '1.25',
    }, `Level Up ${weapon.name}`)
    card.appendChild(name)

    const levelInfo = el('div', {
      fontSize: '14px',
      fontWeight: '600',
      color: weaponColor,
      textAlign: 'center',
      marginBottom: '10px',
    }, `Lv ${choice.currentLevel} \u2192 Lv ${choice.currentLevel + 1}`)
    card.appendChild(levelInfo)

    // Show what improves
    const nextLevel = choice.currentLevel + 1
    let improveLine = `+${(WEAPON_DAMAGE_PER_LEVEL * 100).toFixed(0)}% damage`
    if ((nextLevel - 1) % WEAPON_PROJ_MILESTONE === 0 && nextLevel > 1) {
      improveLine += ', +1 projectile'
    }
    if ((nextLevel - 1) % WEAPON_COOLDOWN_MILESTONE === 0 && nextLevel > 1) {
      improveLine += `, -${(WEAPON_COOLDOWN_REDUCTION * 100).toFixed(0)}% cooldown`
    }

    const stat = el('div', {
      fontSize: '12px',
      fontWeight: '600',
      color: weaponColor,
      textAlign: 'center',
      padding: '4px 10px',
      background: `${weaponColor}18`,
      borderRadius: '4px',
    }, improveLine)
    card.appendChild(stat)

    this.bindClick(card, choice)
    return card
  }

  // ── New Weapon Card ───────────────────────────────────────────────────

  private createNewWeaponCard(choice: Extract<LevelUpChoice, { type: 'new_weapon' }>, index: number): HTMLElement {
    const weapon = WEAPONS[choice.weaponKey]
    if (!weapon) return this.makeBaseCard(COL_NEW, index)

    const card = this.makeBaseCard(COL_NEW, index)
    this.addNewBadge(card)

    const weaponColor = hexToCSS(weapon.meshColor ?? 0x66BB6A)
    card.appendChild(this.makeIcon(weapon.name.charAt(0).toUpperCase(), weaponColor))

    const name = el('div', {
      fontSize: '17px',
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: '6px',
      lineHeight: '1.25',
    }, weapon.name)
    card.appendChild(name)

    const patterns = ['Nearest', 'Forward', 'Radial', 'Spread', 'Orbit', 'Aura', 'Trail', 'Homing']
    const desc = el('div', {
      fontSize: '13px',
      fontWeight: '400',
      color: '#B0B0B0',
      textAlign: 'center',
      lineHeight: '1.4',
      marginBottom: '10px',
    }, `${patterns[weapon.pattern] || '?'} pattern`)
    card.appendChild(desc)

    const stat = el('div', {
      fontSize: '12px',
      fontWeight: '600',
      color: COL_NEW,
      textAlign: 'center',
      padding: '4px 10px',
      background: `${COL_NEW}18`,
      borderRadius: '4px',
      lineHeight: '1.4',
    }, `Dmg: ${weapon.damage}  |  CD: ${weapon.cooldown}s\nProj: ${weapon.projectileCount}`)
    card.appendChild(stat)

    this.bindClick(card, choice)
    return card
  }

  // ── Tome Upgrade Card ─────────────────────────────────────────────────

  private createTomeUpgradeCard(choice: Extract<LevelUpChoice, { type: 'tome_upgrade' }>, index: number): HTMLElement {
    const tome = TOMES.find(t => t.id === choice.tomeId)
    if (!tome) return this.makeBaseCard(COL_TOME, index)

    const card = this.makeBaseCard(COL_TOME, index)

    card.appendChild(this.makeIcon(tome.name.charAt(0).toUpperCase(), COL_TOME))

    const name = el('div', {
      fontSize: '17px',
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: '6px',
      lineHeight: '1.25',
    }, `Level Up ${tome.name}`)
    card.appendChild(name)

    const levelInfo = el('div', {
      fontSize: '14px',
      fontWeight: '600',
      color: COL_TOME,
      textAlign: 'center',
      marginBottom: '10px',
    }, `Lv ${choice.currentLevel} \u2192 Lv ${choice.currentLevel + 1}`)
    card.appendChild(levelInfo)

    const bonusText = tome.isPercent
      ? `+${(tome.perLevel * 100).toFixed(0)}% ${tome.stat}`
      : `+${tome.perLevel} ${tome.stat}`

    const stat = el('div', {
      fontSize: '12px',
      fontWeight: '600',
      color: COL_TOME,
      textAlign: 'center',
      padding: '4px 10px',
      background: `${COL_TOME}18`,
      borderRadius: '4px',
    }, bonusText)
    card.appendChild(stat)

    this.bindClick(card, choice)
    return card
  }

  // ── New Tome Card ─────────────────────────────────────────────────────

  private createNewTomeCard(choice: Extract<LevelUpChoice, { type: 'new_tome' }>, index: number): HTMLElement {
    const tome = choice.tome
    const card = this.makeBaseCard(COL_TOME, index)
    this.addNewBadge(card)

    card.appendChild(this.makeIcon(tome.name.charAt(0).toUpperCase(), COL_TOME))

    const name = el('div', {
      fontSize: '17px',
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: '10px',
      lineHeight: '1.25',
    }, tome.name)
    card.appendChild(name)

    const desc = el('div', {
      fontSize: '13px',
      fontWeight: '400',
      color: '#B0B0B0',
      textAlign: 'center',
      lineHeight: '1.4',
      marginBottom: '14px',
    }, tome.description)
    card.appendChild(desc)

    const statText = tome.isPercent
      ? `+${(tome.perLevel * 100).toFixed(0)}% ${tome.stat} per level`
      : `+${tome.perLevel} ${tome.stat} per level`

    const stat = el('div', {
      fontSize: '12px',
      fontWeight: '600',
      color: COL_TOME,
      textAlign: 'center',
      padding: '4px 10px',
      background: `${COL_TOME}18`,
      borderRadius: '4px',
    }, statText)
    card.appendChild(stat)

    this.bindClick(card, choice)
    return card
  }
}
