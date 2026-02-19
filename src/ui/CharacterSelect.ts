import { CHARACTERS, CharacterDef } from '../data/characters'
import { WEAPONS } from '../data/weapons'

// ---- Color palette ----------------------------------------------------------
const COL_BG = '#1A1A2E'
const COL_TEXT = '#E0E0E0'
const COL_ACCENT = '#29B6F6'
const COL_GOLD = '#FFD54F'

// ---- Keyframe injection (once) ----------------------------------------------
let stylesInjected = false

function injectKeyframes(): void {
  if (stylesInjected) return
  stylesInjected = true

  const sheet = document.createElement('style')
  sheet.textContent = `
    @keyframes smash-charsel-fade {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes smash-charsel-title {
      0%   { transform: scale(0.4); opacity: 0; }
      50%  { transform: scale(1.1); opacity: 1; }
      70%  { transform: scale(0.95); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes smash-charsel-card-enter {
      0%   { transform: translateY(40px) scale(0.9); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
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

// ---- CharacterSelect --------------------------------------------------------

export class CharacterSelect {
  private overlay: HTMLElement
  private cardContainer: HTMLElement
  private title: HTMLElement
  private visible = false
  private onSelect: ((char: CharacterDef) => void) | null = null

  constructor() {
    injectKeyframes()

    // Full-screen overlay
    this.overlay = el('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '250',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      color: COL_TEXT,
      userSelect: 'none',
      overflowY: 'auto',
    })

    // Title
    this.title = el('div', {
      fontSize: '52px',
      fontWeight: '900',
      color: COL_GOLD,
      textShadow: `0 0 20px ${COL_GOLD}88, 0 2px 8px rgba(0,0,0,0.6)`,
      marginBottom: '36px',
      marginTop: '24px',
      letterSpacing: '0.1em',
    }, 'SELECT CHARACTER')
    this.overlay.appendChild(this.title)

    // Card row container
    this.cardContainer = el('div', {
      display: 'flex',
      gap: '20px',
      alignItems: 'stretch',
      justifyContent: 'center',
      flexWrap: 'wrap',
      padding: '0 24px 24px 24px',
      maxWidth: '1400px',
    })
    this.overlay.appendChild(this.cardContainer)

    document.body.appendChild(this.overlay)
  }

  show(onSelect: (char: CharacterDef) => void): void {
    this.onSelect = onSelect
    this.visible = true

    // Clear previous cards
    this.cardContainer.innerHTML = ''

    // Animate overlay in
    this.overlay.style.display = 'flex'
    this.overlay.style.animation = 'smash-charsel-fade 0.3s ease-out forwards'

    // Animate title
    this.title.style.animation = 'smash-charsel-title 0.6s ease-out forwards'

    // Build cards
    CHARACTERS.forEach((char, index) => {
      const card = this.createCard(char, index)
      this.cardContainer.appendChild(card)
    })
  }

  hide(): void {
    this.visible = false
    this.onSelect = null
    this.overlay.style.display = 'none'
    this.cardContainer.innerHTML = ''
  }

  destroy(): void {
    this.overlay.remove()
  }

  // ---- Private helpers ----------------------------------------------------

  private createCard(char: CharacterDef, index: number): HTMLElement {
    const accentColor = hexToCSS(char.meshColor)
    const isLocked = !char.unlocked

    const card = el('div', {
      width: '200px',
      minHeight: '300px',
      background: `${COL_BG}ee`,
      border: `1px solid ${isLocked ? '#444444' : accentColor}`,
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '20px 16px',
      cursor: isLocked ? 'not-allowed' : 'pointer',
      boxSizing: 'border-box',
      transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      pointerEvents: 'auto',
      animation: `smash-charsel-card-enter 0.4s ease-out ${index * 0.08}s both`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      opacity: isLocked ? '0.5' : '1',
      filter: isLocked ? 'grayscale(0.8)' : 'none',
      position: 'relative',
    })

    // Character icon - colored circle with first letter
    const icon = el('div', {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: isLocked
        ? 'linear-gradient(135deg, #33333344, #22222222)'
        : `linear-gradient(135deg, ${accentColor}44, ${accentColor}22)`,
      border: `2px solid ${isLocked ? '#555' : accentColor + '88'}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: '800',
      color: isLocked ? '#666' : accentColor,
      marginBottom: '12px',
      flexShrink: '0',
    }, isLocked ? '\u{1F512}' : char.name.charAt(0).toUpperCase())
    card.appendChild(icon)

    // Name
    const name = el('div', {
      fontSize: '17px',
      fontWeight: '700',
      color: isLocked ? '#666' : '#FFFFFF',
      textAlign: 'center',
      marginBottom: '8px',
      lineHeight: '1.25',
    }, char.name)
    card.appendChild(name)

    // Description
    const desc = el('div', {
      fontSize: '12px',
      fontWeight: '400',
      color: isLocked ? '#555' : '#B0B0B0',
      textAlign: 'center',
      lineHeight: '1.4',
      marginBottom: '12px',
    }, isLocked ? (char.unlockCondition ?? 'Locked') : char.description)
    card.appendChild(desc)

    if (!isLocked) {
      // Starting weapon
      const weaponDef = WEAPONS[char.startingWeapon]
      const weaponName = weaponDef ? weaponDef.name : char.startingWeapon
      const weaponLine = el('div', {
        fontSize: '11px',
        fontWeight: '600',
        color: COL_ACCENT,
        textAlign: 'center',
        padding: '3px 8px',
        background: `${COL_ACCENT}18`,
        borderRadius: '4px',
        marginBottom: '6px',
        width: '100%',
        boxSizing: 'border-box',
      }, `Weapon: ${weaponName}`)
      card.appendChild(weaponLine)

      // Passive ability
      const passiveLine = el('div', {
        fontSize: '11px',
        fontWeight: '600',
        color: COL_GOLD,
        textAlign: 'center',
        padding: '3px 8px',
        background: `${COL_GOLD}18`,
        borderRadius: '4px',
        marginBottom: '10px',
        width: '100%',
        boxSizing: 'border-box',
      }, `${char.passive.name}: ${char.passive.description}`)
      card.appendChild(passiveLine)

      // Base stats
      const statsContainer = el('div', {
        display: 'flex',
        gap: '8px',
        justifyContent: 'center',
        width: '100%',
      })

      const statItems: Array<{ label: string; value: number; color: string }> = [
        { label: 'HP', value: char.baseHp, color: '#EF5350' },
        { label: 'SPD', value: char.baseSpeed, color: '#76FF03' },
        { label: 'ARM', value: char.baseArmor, color: COL_ACCENT },
      ]

      for (const stat of statItems) {
        const statEl = el('div', {
          fontSize: '10px',
          fontWeight: '600',
          color: stat.color,
          textAlign: 'center',
          lineHeight: '1.3',
        })
        statEl.innerHTML = `<div style="font-size:14px;font-weight:800">${stat.value}</div>${stat.label}`
        statsContainer.appendChild(statEl)
      }

      card.appendChild(statsContainer)
    }

    // Hover effects (only for unlocked)
    if (!isLocked) {
      card.addEventListener('mouseenter', () => {
        card.style.transform = 'scale(1.06)'
        card.style.borderColor = accentColor
        card.style.boxShadow = `0 0 24px ${accentColor}66, 0 8px 32px rgba(0,0,0,0.5)`
      })
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'scale(1)'
        card.style.borderColor = accentColor
        card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'
      })

      // Click
      card.addEventListener('click', () => {
        if (this.onSelect) {
          this.onSelect(char)
        }
        this.hide()
      })
    }

    return card
  }
}
