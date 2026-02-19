// ---- Color palette ----------------------------------------------------------
const COL_BG = '#1A1A2E'
const COL_TEXT = '#E0E0E0'
const COL_ACCENT = '#29B6F6'
const COL_HP = '#EF5350'
const COL_GOLD = '#FFD54F'

// ---- Keyframe injection (once) ----------------------------------------------
let stylesInjected = false

function injectKeyframes(): void {
  if (stylesInjected) return
  stylesInjected = true

  const sheet = document.createElement('style')
  sheet.textContent = `
    @keyframes smash-death-fade {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
    @keyframes smash-death-title {
      0%   { transform: scale(2.5); opacity: 0; letter-spacing: 0.4em; }
      60%  { transform: scale(0.95); opacity: 1; letter-spacing: 0.08em; }
      100% { transform: scale(1); opacity: 1; letter-spacing: 0.1em; }
    }
    @keyframes smash-death-stats {
      0%   { transform: translateY(30px); opacity: 0; }
      100% { transform: translateY(0); opacity: 1; }
    }
    @keyframes smash-death-btn-pulse {
      0%, 100% { box-shadow: 0 0 12px ${COL_ACCENT}44; }
      50%      { box-shadow: 0 0 24px ${COL_ACCENT}88; }
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

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// ---- Stats display ----------------------------------------------------------

interface DeathStats {
  timeAlive: number
  kills: number
  level: number
  gold: number
}

// ---- DeathScreen ------------------------------------------------------------

export class DeathScreen {
  private overlay: HTMLElement
  private contentContainer: HTMLElement
  private visible: boolean = false

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
      zIndex: '300',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      color: COL_TEXT,
      userSelect: 'none',
    })

    // Inner content wrapper
    this.contentContainer = el('div', {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0px',
    })
    this.overlay.appendChild(this.contentContainer)

    document.body.appendChild(this.overlay)
  }

  show(stats: DeathStats): void {
    this.visible = true
    this.contentContainer.innerHTML = ''

    // Animate overlay
    this.overlay.style.display = 'flex'
    this.overlay.style.animation = 'smash-death-fade 0.5s ease-out forwards'

    // "YOU DIED" title
    const title = el('div', {
      fontSize: '72px',
      fontWeight: '900',
      color: COL_HP,
      textShadow: `0 0 30px ${COL_HP}88, 0 0 60px ${COL_HP}44, 0 4px 12px rgba(0,0,0,0.7)`,
      marginBottom: '48px',
      animation: 'smash-death-title 0.8s ease-out forwards',
    }, 'YOU DIED')
    this.contentContainer.appendChild(title)

    // Stats panel
    const panel = el('div', {
      background: `${COL_BG}dd`,
      border: `1px solid ${COL_ACCENT}44`,
      borderRadius: '12px',
      padding: '28px 40px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      minWidth: '320px',
      animation: 'smash-death-stats 0.6s ease-out 0.3s both',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    })

    const statsData: Array<{ label: string; value: string; color: string }> = [
      { label: 'Time Survived', value: formatTime(stats.timeAlive), color: COL_TEXT },
      { label: 'Enemies Killed', value: String(stats.kills), color: COL_HP },
      { label: 'Level Reached', value: String(stats.level), color: COL_ACCENT },
      { label: 'Gold Earned', value: String(stats.gold), color: COL_GOLD },
    ]

    for (const { label, value, color } of statsData) {
      const row = el('div', {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 0',
      })

      const labelEl = el('span', {
        fontSize: '16px',
        fontWeight: '500',
        color: '#A0A0A0',
      }, label)

      const valueEl = el('span', {
        fontSize: '20px',
        fontWeight: '700',
        color: color,
        fontVariantNumeric: 'tabular-nums',
      }, value)

      row.appendChild(labelEl)
      row.appendChild(valueEl)
      panel.appendChild(row)
    }

    this.contentContainer.appendChild(panel)

    // "Try Again" button
    const btn = el('button', {
      marginTop: '36px',
      padding: '14px 48px',
      fontSize: '18px',
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
      animation: `smash-death-stats 0.6s ease-out 0.5s both, smash-death-btn-pulse 2s ease-in-out 1.1s infinite`,
      boxShadow: `0 0 12px ${COL_ACCENT}44`,
    }, 'Try Again')

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.05)'
      btn.style.boxShadow = `0 0 28px ${COL_ACCENT}88`
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)'
      btn.style.boxShadow = `0 0 12px ${COL_ACCENT}44`
    })
    btn.addEventListener('click', () => {
      window.location.reload()
    })

    this.contentContainer.appendChild(btn)
  }

  hide(): void {
    this.visible = false
    this.overlay.style.display = 'none'
    this.contentContainer.innerHTML = ''
  }

  destroy(): void {
    this.overlay.remove()
  }
}
