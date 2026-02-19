import { ITEMS, RARITY_COLORS } from '../data/items'
import { CHARACTERS } from '../data/characters'
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
    @keyframes smash-shop-fade {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes smash-shop-slide {
      0%   { transform: translateY(30px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
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

// ---- Shop item pricing -----------------------------------------------------

interface ShopEntry {
  id: string
  name: string
  description: string
  cost: number
  category: 'item' | 'weapon' | 'character'
  color: string
}

function buildShopEntries(): ShopEntry[] {
  const entries: ShopEntry[] = []

  // Items - price based on rarity
  const rarityPrices: Record<string, number> = {
    common: 100,
    uncommon: 250,
    rare: 500,
    epic: 1000,
    legendary: 2500,
  }

  for (const item of ITEMS) {
    entries.push({
      id: item.id,
      name: item.name,
      description: item.description,
      cost: rarityPrices[item.rarity] ?? 100,
      category: 'item',
      color: RARITY_COLORS[item.rarity] ?? '#B0B0B0',
    })
  }

  // Locked characters
  for (const char of CHARACTERS) {
    if (!char.unlocked) {
      entries.push({
        id: char.id,
        name: char.name,
        description: char.description,
        cost: 2000,
        category: 'character',
        color: '#' + char.meshColor.toString(16).padStart(6, '0'),
      })
    }
  }

  // Extra weapons as shop items
  const shopWeapons = ['lightning_staff', 'flamewalker', 'shotgun', 'boomerang', 'frostwalker', 'dice']
  for (const wid of shopWeapons) {
    const w = WEAPONS[wid]
    if (w) {
      entries.push({
        id: w.id,
        name: w.name,
        description: `Unlock the ${w.name} weapon`,
        cost: 750,
        category: 'weapon',
        color: '#' + (w.meshColor ?? 0xFFFFFF).toString(16).padStart(6, '0'),
      })
    }
  }

  return entries
}

// ---- Shop -------------------------------------------------------------------

export class Shop {
  private overlay: HTMLElement
  private contentContainer: HTMLElement
  private visible = false

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
      justifyContent: 'flex-start',
      zIndex: '260',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      color: COL_TEXT,
      userSelect: 'none',
      overflowY: 'auto',
    })

    // Inner content wrapper
    this.contentContainer = el('div', {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0px',
      width: '100%',
      maxWidth: '800px',
      padding: '24px',
      boxSizing: 'border-box',
    })
    this.overlay.appendChild(this.contentContainer)

    document.body.appendChild(this.overlay)
  }

  show(gold: number, onClose: () => void): void {
    this.visible = true
    this.contentContainer.innerHTML = ''

    // Animate overlay
    this.overlay.style.display = 'flex'
    this.overlay.style.animation = 'smash-shop-fade 0.3s ease-out forwards'

    // Title
    const title = el('div', {
      fontSize: '48px',
      fontWeight: '900',
      color: COL_GOLD,
      textShadow: `0 0 20px ${COL_GOLD}88, 0 2px 8px rgba(0,0,0,0.6)`,
      marginBottom: '8px',
      letterSpacing: '0.1em',
    }, 'SHOP')
    this.contentContainer.appendChild(title)

    // Gold display
    const goldDisplay = el('div', {
      fontSize: '20px',
      fontWeight: '700',
      color: COL_GOLD,
      marginBottom: '24px',
    }, `Gold: ${gold}`)
    this.contentContainer.appendChild(goldDisplay)

    // Build shop entries
    const entries = buildShopEntries()

    // Category sections
    const categories: Array<{ key: string; label: string }> = [
      { key: 'item', label: 'Items' },
      { key: 'weapon', label: 'Weapons' },
      { key: 'character', label: 'Characters' },
    ]

    for (const cat of categories) {
      const catEntries = entries.filter(e => e.category === cat.key)
      if (catEntries.length === 0) continue

      // Section header
      const header = el('div', {
        fontSize: '22px',
        fontWeight: '700',
        color: COL_ACCENT,
        marginTop: '16px',
        marginBottom: '12px',
        width: '100%',
        borderBottom: `1px solid ${COL_ACCENT}44`,
        paddingBottom: '8px',
        animation: 'smash-shop-slide 0.4s ease-out forwards',
      }, cat.label)
      this.contentContainer.appendChild(header)

      // Items list
      for (const entry of catEntries) {
        const row = this.createShopRow(entry, gold, goldDisplay)
        this.contentContainer.appendChild(row)
      }
    }

    // Close button
    const closeBtn = el('button', {
      marginTop: '28px',
      marginBottom: '24px',
      padding: '12px 40px',
      fontSize: '16px',
      fontWeight: '700',
      color: '#FFFFFF',
      background: `linear-gradient(135deg, ${COL_ACCENT}, #0288D1)`,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      boxShadow: `0 0 12px ${COL_ACCENT}44`,
    }, 'Close')

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.transform = 'scale(1.05)'
      closeBtn.style.boxShadow = `0 0 28px ${COL_ACCENT}88`
    })
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.transform = 'scale(1)'
      closeBtn.style.boxShadow = `0 0 12px ${COL_ACCENT}44`
    })
    closeBtn.addEventListener('click', () => {
      this.hide()
      onClose()
    })

    this.contentContainer.appendChild(closeBtn)
  }

  hide(): void {
    this.visible = false
    this.overlay.style.display = 'none'
    this.contentContainer.innerHTML = ''
  }

  destroy(): void {
    this.overlay.remove()
  }

  // ---- Private helpers ----------------------------------------------------

  private createShopRow(entry: ShopEntry, gold: number, _goldDisplay: HTMLElement): HTMLElement {
    const canAfford = gold >= entry.cost

    const row = el('div', {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '10px 16px',
      background: `${COL_BG}cc`,
      border: `1px solid ${entry.color}33`,
      borderRadius: '8px',
      marginBottom: '6px',
      boxSizing: 'border-box',
      animation: 'smash-shop-slide 0.4s ease-out forwards',
      transition: 'border-color 0.2s ease',
    })

    row.addEventListener('mouseenter', () => {
      row.style.borderColor = entry.color + '88'
    })
    row.addEventListener('mouseleave', () => {
      row.style.borderColor = entry.color + '33'
    })

    // Left side: name + description
    const info = el('div', {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      flex: '1',
      marginRight: '16px',
    })

    const nameLine = el('div', {
      fontSize: '14px',
      fontWeight: '700',
      color: entry.color,
    }, entry.name)
    info.appendChild(nameLine)

    const descLine = el('div', {
      fontSize: '11px',
      fontWeight: '400',
      color: '#999',
    }, entry.description)
    info.appendChild(descLine)

    row.appendChild(info)

    // Right side: cost + buy button
    const rightSide = el('div', {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexShrink: '0',
    })

    const costText = el('div', {
      fontSize: '14px',
      fontWeight: '700',
      color: canAfford ? COL_GOLD : '#666',
    }, `${entry.cost}g`)
    rightSide.appendChild(costText)

    const buyBtn = el('button', {
      padding: '6px 16px',
      fontSize: '12px',
      fontWeight: '700',
      color: canAfford ? '#FFFFFF' : '#666',
      background: canAfford ? `${COL_ACCENT}` : '#333',
      border: 'none',
      borderRadius: '4px',
      cursor: canAfford ? 'pointer' : 'not-allowed',
      pointerEvents: 'auto',
      transition: 'transform 0.15s ease',
      opacity: canAfford ? '1' : '0.5',
    }, 'Buy')

    if (canAfford) {
      buyBtn.addEventListener('mouseenter', () => {
        buyBtn.style.transform = 'scale(1.05)'
      })
      buyBtn.addEventListener('mouseleave', () => {
        buyBtn.style.transform = 'scale(1)'
      })
      buyBtn.addEventListener('click', () => {
        // Mark as purchased visually
        buyBtn.textContent = 'Sold'
        buyBtn.style.background = '#333'
        buyBtn.style.cursor = 'not-allowed'
        buyBtn.style.opacity = '0.5'
        console.log(`[Shop] Purchased: ${entry.name} for ${entry.cost}g`)
      })
    }

    rightSide.appendChild(buyBtn)
    row.appendChild(rightSide)

    return row
  }
}
