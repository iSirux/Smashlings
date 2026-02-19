import { getQuestProgress, getCompletedCount } from '../systems/progression/QuestSystem'
import type { QuestDef } from '../data/quests'
import type { QuestProgress } from '../systems/progression/QuestSystem'

// ---- Color palette ----------------------------------------------------------
const COL_BG = '#1A1A2E'
const COL_TEXT = '#E0E0E0'
const COL_ACCENT = '#29B6F6'
const COL_GOLD = '#FFD54F'
const COL_GREEN = '#66BB6A'

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

// ---- Keyframe injection (once) ----------------------------------------------
let stylesInjected = false

function injectKeyframes(): void {
  if (stylesInjected) return
  stylesInjected = true

  const sheet = document.createElement('style')
  sheet.textContent = `
    @keyframes smash-quest-fade-in {
      0%   { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes smash-quest-overlay-in {
      0%   { opacity: 0; }
      100% { opacity: 1; }
    }
  `
  document.head.appendChild(sheet)
}

// ---- Quest type labels and grouping -----------------------------------------

const QUEST_TYPE_LABELS: Record<string, string> = {
  kills: 'Kill Quests',
  survive: 'Survival Quests',
  level: 'Level Quests',
  gold: 'Gold Quests',
  collect: 'Collection Quests',
  clear: 'Challenge Quests',
}

const QUEST_TYPE_ORDER: string[] = ['kills', 'survive', 'level', 'gold', 'collect', 'clear']

// ---- QuestLog ---------------------------------------------------------------

export class QuestLog {
  private overlay: HTMLElement
  private content: HTMLElement
  private visible = false
  private keyHandler: (e: KeyboardEvent) => void

  constructor() {
    injectKeyframes()

    // Full-screen overlay
    this.overlay = el('div', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '250',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      color: COL_TEXT,
      userSelect: 'none',
    })

    // Inner panel
    const panel = el('div', {
      background: `${COL_BG}ee`,
      border: `1px solid ${COL_ACCENT}44`,
      borderRadius: '12px',
      padding: '24px 32px',
      maxWidth: '600px',
      width: '90vw',
      maxHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      animation: 'smash-quest-fade-in 0.3s ease-out forwards',
    })

    // Header row
    const header = el('div', {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      flexShrink: '0',
    })

    const title = el('div', {
      fontSize: '28px',
      fontWeight: '900',
      color: COL_GOLD,
      letterSpacing: '0.1em',
      textShadow: `0 0 12px ${COL_GOLD}44`,
    }, 'QUESTS')
    header.appendChild(title)

    // Close button
    const closeBtn = el('button', {
      background: 'none',
      border: `1px solid ${COL_TEXT}44`,
      borderRadius: '6px',
      color: COL_TEXT,
      fontSize: '14px',
      fontWeight: '600',
      padding: '4px 12px',
      cursor: 'pointer',
      pointerEvents: 'auto',
      transition: 'background 0.15s, border-color 0.15s',
    }, 'Close [Tab]')
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = `${COL_ACCENT}22`
      closeBtn.style.borderColor = COL_ACCENT
    })
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'none'
      closeBtn.style.borderColor = `${COL_TEXT}44`
    })
    closeBtn.addEventListener('click', () => this.hide())
    header.appendChild(closeBtn)
    panel.appendChild(header)

    // Scrollable content area
    this.content = el('div', {
      overflowY: 'auto',
      flex: '1',
      paddingRight: '8px',
    })
    panel.appendChild(this.content)

    this.overlay.appendChild(panel)

    // Click overlay background to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.hide()
    })

    document.body.appendChild(this.overlay)

    // Tab key toggles quest log
    this.keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault()
        this.toggle()
      }
    }
    window.addEventListener('keydown', this.keyHandler)
  }

  toggle(): void {
    if (this.visible) {
      this.hide()
    } else {
      this.show()
    }
  }

  show(): void {
    this.visible = true
    this.refresh()
    this.overlay.style.display = 'flex'
    this.overlay.style.animation = 'smash-quest-overlay-in 0.2s ease-out forwards'
  }

  hide(): void {
    this.visible = false
    this.overlay.style.display = 'none'
  }

  refresh(): void {
    this.content.innerHTML = ''

    const allQuests = getQuestProgress()
    const completedCount = getCompletedCount()

    // Completion summary
    const summary = el('div', {
      fontSize: '14px',
      color: '#A0A0A0',
      marginBottom: '16px',
      textAlign: 'center',
    }, `${completedCount} / ${allQuests.length} completed`)
    this.content.appendChild(summary)

    // Group quests by type
    const grouped = new Map<string, Array<{ quest: QuestDef; progress: QuestProgress }>>()
    for (const entry of allQuests) {
      const type = entry.quest.type
      if (!grouped.has(type)) grouped.set(type, [])
      grouped.get(type)!.push(entry)
    }

    // Render each group in order
    for (const type of QUEST_TYPE_ORDER) {
      const quests = grouped.get(type)
      if (!quests || quests.length === 0) continue

      // Group header
      const groupHeader = el('div', {
        fontSize: '16px',
        fontWeight: '700',
        color: COL_ACCENT,
        marginTop: '12px',
        marginBottom: '8px',
        paddingBottom: '4px',
        borderBottom: `1px solid ${COL_ACCENT}33`,
        letterSpacing: '0.04em',
      }, QUEST_TYPE_LABELS[type] || type)
      this.content.appendChild(groupHeader)

      // Individual quests
      for (const { quest, progress } of quests) {
        const card = this.createQuestCard(quest, progress)
        this.content.appendChild(card)
      }
    }
  }

  private createQuestCard(quest: QuestDef, progress: QuestProgress): HTMLElement {
    const card = el('div', {
      background: progress.completed ? `${COL_GREEN}11` : `#ffffff08`,
      border: `1px solid ${progress.completed ? COL_GREEN + '44' : '#ffffff15'}`,
      borderRadius: '8px',
      padding: '10px 14px',
      marginBottom: '6px',
      transition: 'background 0.15s',
    })

    // Top row: name + status
    const topRow = el('div', {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '4px',
    })

    const nameEl = el('span', {
      fontSize: '15px',
      fontWeight: '700',
      color: progress.completed ? COL_GREEN : COL_TEXT,
    }, quest.name)
    topRow.appendChild(nameEl)

    if (progress.completed) {
      const check = el('span', {
        fontSize: '16px',
        color: COL_GREEN,
        fontWeight: '700',
      }, 'DONE')
      topRow.appendChild(check)
    } else {
      const countEl = el('span', {
        fontSize: '13px',
        color: '#A0A0A0',
        fontVariantNumeric: 'tabular-nums',
      }, `${Math.min(progress.current, quest.target)} / ${quest.target}`)
      topRow.appendChild(countEl)
    }

    card.appendChild(topRow)

    // Description
    const descEl = el('div', {
      fontSize: '12px',
      color: '#808080',
      marginBottom: '6px',
    }, quest.description)
    card.appendChild(descEl)

    // Progress bar
    const barOuter = el('div', {
      width: '100%',
      height: '6px',
      background: '#00000066',
      borderRadius: '3px',
      overflow: 'hidden',
    })

    const pct = quest.target > 0
      ? Math.min(100, (progress.current / quest.target) * 100)
      : 0

    const barInner = el('div', {
      width: `${pct}%`,
      height: '100%',
      background: progress.completed
        ? `linear-gradient(90deg, ${COL_GREEN}, #43A047)`
        : `linear-gradient(90deg, ${COL_ACCENT}, #0288D1)`,
      borderRadius: '3px',
      transition: 'width 0.3s ease-out',
    })
    barOuter.appendChild(barInner)
    card.appendChild(barOuter)

    // Reward line
    const rewardRow = el('div', {
      display: 'flex',
      gap: '8px',
      marginTop: '4px',
      fontSize: '11px',
      color: COL_GOLD,
    })

    const goldReward = el('span', {}, `+${quest.reward.gold} gold`)
    rewardRow.appendChild(goldReward)

    if (quest.reward.unlock) {
      const unlockReward = el('span', {
        color: COL_ACCENT,
      }, `Unlocks: ${quest.reward.unlock}`)
      rewardRow.appendChild(unlockReward)
    }

    card.appendChild(rewardRow)

    return card
  }

  destroy(): void {
    window.removeEventListener('keydown', this.keyHandler)
    this.overlay.remove()
  }
}
