import * as Tone from 'tone'

let initialized = false
let droneOsc: Tone.Oscillator | null = null
let padSynth: Tone.Synth | null = null
let padFilter: Tone.Filter | null = null
let arpSynth: Tone.Synth | null = null
let arpFilter: Tone.Filter | null = null
let arpLoop: Tone.Loop | null = null

let currentIntensity = 0
let targetIntensity = 0

export function initMusic(): void {
  // Defer initialization until audio context is started by user interaction
  document.addEventListener('click', () => startMusic(), { once: true })
  document.addEventListener('keydown', () => startMusic(), { once: true })
}

async function startMusic(): Promise<void> {
  if (initialized) return
  await Tone.start()
  initialized = true

  // Layer 1: Sub bass drone (always playing, very quiet)
  droneOsc = new Tone.Oscillator({
    frequency: 40,
    type: 'sine',
    volume: -30,
  }).toDestination()
  droneOsc.start()

  // Layer 2: Pad chord (fades in with intensity)
  padFilter = new Tone.Filter(800, 'lowpass').toDestination()
  padSynth = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 2, decay: 1, sustain: 0.3, release: 2 },
    volume: -40, // starts very quiet
  }).connect(padFilter)

  // Layer 3: Arpeggiated pulse (appears at higher intensity)
  arpFilter = new Tone.Filter(1200, 'lowpass').toDestination()
  arpSynth = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.1 },
    volume: -35,
  }).connect(arpFilter)

  // Arp pattern (minor key: Am)
  const notes = ['A3', 'C4', 'E4', 'A4', 'E4', 'C4']
  let noteIndex = 0
  arpLoop = new Tone.Loop((time) => {
    if (currentIntensity >= 0.5 && arpSynth) {
      arpSynth.triggerAttackRelease(notes[noteIndex % notes.length], '8n', time)
      noteIndex++
    }
  }, '8n')
  arpLoop.start(0)

  // Start transport
  Tone.getTransport().bpm.value = 120
  Tone.getTransport().start()
}

/**
 * Call every frame from the game loop to update music intensity.
 * @param elapsed  Total elapsed game time in seconds.
 * @param gameTimer  Countdown timer remaining in seconds.
 */
export function updateMusic(elapsed: number, gameTimer: number): void {
  if (!initialized) return

  // Calculate target intensity based on game state
  // 0 = calm start, 1 = max intensity (boss/final swarm)
  const timeProgress = elapsed / 600 // 0 to 1 over 10 minutes
  targetIntensity = Math.min(1, timeProgress * 1.2)

  // If timer is low, increase intensity
  if (gameTimer < 120) { // less than 2 minutes
    targetIntensity = Math.max(targetIntensity, 0.8)
  }

  // Smooth intensity transition
  currentIntensity += (targetIntensity - currentIntensity) * 0.01

  // Update volumes based on intensity
  if (droneOsc) {
    droneOsc.volume.value = -30 + currentIntensity * 10 // -30 to -20
  }

  if (padSynth) {
    padSynth.volume.value = -40 + currentIntensity * 20 // -40 to -20
    // Trigger pad note periodically (roughly every ~1000 frames)
    if (Math.random() < 0.001) {
      padSynth.triggerAttackRelease('A2', 4)
    }
  }

  if (arpSynth) {
    const arpVol = currentIntensity >= 0.5 ? -35 + (currentIntensity - 0.5) * 30 : -60
    arpSynth.volume.value = arpVol
  }
}

/** Override target intensity directly (e.g. for boss encounters). */
export function setMusicIntensity(intensity: number): void {
  targetIntensity = Math.max(0, Math.min(1, intensity))
}

/** Dispose all audio nodes and stop the transport. */
export function disposeMusic(): void {
  arpLoop?.stop()
  arpLoop?.dispose()
  droneOsc?.stop()
  droneOsc?.dispose()
  padSynth?.dispose()
  padFilter?.dispose()
  arpSynth?.dispose()
  arpFilter?.dispose()
  Tone.getTransport().stop()

  droneOsc = null
  padSynth = null
  padFilter = null
  arpSynth = null
  arpFilter = null
  arpLoop = null
  initialized = false
}
