import * as Tone from 'tone'
import { eventBus } from '../../core/EventBus'

let initialized = false

// Synths - created lazily after user interaction (AudioContext requirement)
let hitSynth: Tone.Synth | null = null
let killSynth: Tone.FMSynth | null = null
let pickupSynth: Tone.Synth | null = null
let levelUpSynth: Tone.PolySynth | null = null
let hurtSynth: Tone.Synth | null = null
let dashSynth: Tone.NoiseSynth | null = null

// Tracks the last scheduled time per synth to avoid "start time must be greater" errors
// when multiple events fire in the same frame
let lastHitTime = 0
let lastKillTime = 0
let lastPickupTime = 0

function safeNow(lastTime: number): number {
  const now = Tone.now()
  return now <= lastTime ? lastTime + 0.005 : now
}

function ensureInitialized(): void {
  if (initialized) return
  initialized = true

  // Hit sound - sine sweep, pitch varies with damage
  hitSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 },
    volume: -12,
  }).toDestination()

  // Kill sound - FM pop
  killSynth = new Tone.FMSynth({
    harmonicity: 3,
    modulationIndex: 10,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.05 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
    volume: -10,
  }).toDestination()

  // XP pickup chirp
  pickupSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 },
    volume: -18,
  }).toDestination()

  // Level up arpeggio
  levelUpSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.2 },
    volume: -8,
  }).toDestination()

  // Player hurt
  hurtSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.02 },
    volume: -10,
  }).toDestination()

  // Dash whoosh
  dashSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 },
    volume: -20,
  }).toDestination()
}

export function initSFX(): void {
  // Start Tone.js audio context on user interaction
  document.addEventListener('click', async () => {
    await Tone.start()
    ensureInitialized()
  }, { once: true })

  document.addEventListener('keydown', async () => {
    await Tone.start()
    ensureInitialized()
  }, { once: true })

  // Subscribe to game events
  eventBus.on('entity:damaged', (data) => {
    if (!initialized) return

    const t = safeNow(lastHitTime)
    lastHitTime = t
    if (data.isCrit) {
      hitSynth?.triggerAttackRelease(200 + data.amount * 5, 0.12, t)
    } else {
      hitSynth?.triggerAttackRelease(150 + data.amount * 3, 0.08, t)
    }
  })

  eventBus.on('entity:died', (data) => {
    if (!initialized || !data.wasEnemy) return
    const t = safeNow(lastKillTime)
    lastKillTime = t
    killSynth?.triggerAttackRelease(150, 0.12, t)
  })

  eventBus.on('pickup:collected', (data) => {
    if (!initialized) return
    const t = safeNow(lastPickupTime)
    lastPickupTime = t
    const freq = 400 + (data.value || 1) * 50
    pickupSynth?.triggerAttackRelease(Math.min(freq, 1200), 0.06, t)
  })

  eventBus.on('player:levelup', () => {
    if (!initialized) return
    // Major triad arpeggio: C-E-G
    const now = Tone.now()
    levelUpSynth?.triggerAttackRelease('C4', 0.3, now)
    levelUpSynth?.triggerAttackRelease('E4', 0.3, now + 0.1)
    levelUpSynth?.triggerAttackRelease('G4', 0.3, now + 0.2)
  })

  eventBus.on('player:died', () => {
    if (!initialized) return
    // Deep bass hit
    hurtSynth?.triggerAttackRelease(60, 0.5)
  })
}

/** Call this when the player dashes (from input or movement system). */
export function playDashSound(): void {
  if (!initialized) return
  dashSynth?.triggerAttackRelease(0.15)
}

/** Dispose all synths and free audio resources. */
export function disposeSFX(): void {
  hitSynth?.dispose()
  killSynth?.dispose()
  pickupSynth?.dispose()
  levelUpSynth?.dispose()
  hurtSynth?.dispose()
  dashSynth?.dispose()
  hitSynth = null
  killSynth = null
  pickupSynth = null
  levelUpSynth = null
  hurtSynth = null
  dashSynth = null
  initialized = false
}
