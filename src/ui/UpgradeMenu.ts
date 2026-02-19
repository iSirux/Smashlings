import type { TomeDef } from '../data/tomes'

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

function formatStat(tome: TomeDef): string {
  if (tome.isPercent) {
    return `+${(tome.perLevel * 100).toFixed(0)}% ${tome.stat} per level`
  }
  return `+${tome.perLevel} ${tome.stat} per level`
}

// ---- UpgradeMenu ------------------------------------------------------------

export class UpgradeMenu {
  private overlay: HTMLElement
  private cardContainer: HTMLElement
  private title: HTMLElement
  private cards: HTMLElement[] = []
  private visible: boolean = false
  private onSelect: ((tome: TomeDef) => void) | null = null

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
      zIndex: '200',
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

  show(choices: TomeDef[], onSelect: (tome: TomeDef) => void): void {
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
    choices.forEach((tome, index) => {
      const card = this.createCard(tome, index)
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

  private createCard(tome: TomeDef, index: number): HTMLElement {
    const card = el('div', {
      width: '200px',
      height: '280px',
      background: `${COL_BG}ee`,
      border: `1px solid ${COL_ACCENT}`,
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
    })

    // Icon area – a simple circle with the first letter
    const icon = el('div', {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${COL_ACCENT}44, ${COL_ACCENT}22)`,
      border: `2px solid ${COL_ACCENT}88`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontWeight: '800',
      color: COL_ACCENT,
      marginBottom: '16px',
      flexShrink: '0',
    }, tome.name.charAt(0).toUpperCase())
    card.appendChild(icon)

    // Name
    const name = el('div', {
      fontSize: '17px',
      fontWeight: '700',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: '10px',
      lineHeight: '1.25',
    }, tome.name)
    card.appendChild(name)

    // Description
    const desc = el('div', {
      fontSize: '13px',
      fontWeight: '400',
      color: '#B0B0B0',
      textAlign: 'center',
      lineHeight: '1.4',
      marginBottom: '14px',
    }, tome.description)
    card.appendChild(desc)

    // Stat line
    const stat = el('div', {
      fontSize: '12px',
      fontWeight: '600',
      color: COL_ACCENT,
      textAlign: 'center',
      padding: '4px 10px',
      background: `${COL_ACCENT}18`,
      borderRadius: '4px',
    }, formatStat(tome))
    card.appendChild(stat)

    // Hover effects
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.06)'
      card.style.borderColor = COL_ACCENT
      card.style.boxShadow = `0 0 24px ${COL_ACCENT}66, 0 8px 32px rgba(0,0,0,0.5)`
    })
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)'
      card.style.borderColor = COL_ACCENT
      card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'
    })

    // Click
    card.addEventListener('click', () => {
      if (this.onSelect) {
        this.onSelect(tome)
      }
      this.hide()
    })

    return card
  }
}
