/**
 * Fixed-timestep game loop with variable rendering.
 *
 * Physics / logic run at a fixed 60 Hz (dt = 1/60 s).
 * Rendering runs every rAF tick and receives an interpolation alpha so
 * visual state can be smoothly blended between the last two fixed steps.
 *
 * Usage:
 *   gameLoop.setCallbacks(update, render)
 *   gameLoop.start()
 */

const FIXED_DT = 1 / 60                // 60 Hz fixed step (seconds)
const MAX_FRAME_TIME = 0.25            // cap to avoid spiral of death

type UpdateFn = (dt: number) => void
type RenderFn = (alpha: number) => void

class GameLoop {
  // ── Public state ─────────────────────────────────────────────────────
  isPaused = false

  /** Total elapsed game time in seconds (paused time excluded). */
  elapsed = 0

  // ── Callbacks (set after construction) ───────────────────────────────
  private updateFn: UpdateFn | null = null
  private renderFn: RenderFn | null = null

  // ── Internal timing ──────────────────────────────────────────────────
  private accumulator = 0
  private lastTimestamp = 0
  private rafId = 0
  private running = false

  /**
   * Assign the update (fixed-step) and render (variable-step) callbacks.
   * Can be called before or after start().
   */
  setCallbacks(update: UpdateFn, render: RenderFn): void {
    this.updateFn = update
    this.renderFn = render
  }

  /** Begin the loop. Ignored if already running. */
  start(): void {
    if (this.running) return
    this.running = true
    this.isPaused = false
    this.lastTimestamp = 0
    this.accumulator = 0
    this.rafId = requestAnimationFrame(this.tick)
  }

  /** Completely stop the loop and reset timing state. */
  stop(): void {
    if (!this.running) return
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.rafId = 0
  }

  /** Pause game-time progression. Rendering still runs (for pause menus). */
  pause(): void {
    this.isPaused = true
  }

  /** Resume from pause. */
  resume(): void {
    this.isPaused = false
  }

  // ── Main tick ────────────────────────────────────────────────────────

  private tick = (timestamp: number): void => {
    if (!this.running) return

    // First frame: seed lastTimestamp so we don't get a huge delta
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp
    }

    // Raw frame time in seconds, capped to prevent spiral of death
    let frameTime = (timestamp - this.lastTimestamp) / 1000
    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME
    }
    this.lastTimestamp = timestamp

    if (!this.isPaused) {
      this.accumulator += frameTime

      // Fixed-step updates
      while (this.accumulator >= FIXED_DT) {
        if (this.updateFn) {
          this.updateFn(FIXED_DT)
        }
        this.elapsed += FIXED_DT
        this.accumulator -= FIXED_DT
      }
    }

    // Interpolation alpha: how far we are between the last fixed step
    // and the next one. Renderers can use this to interpolate positions.
    const alpha = this.accumulator / FIXED_DT

    if (this.renderFn) {
      this.renderFn(alpha)
    }

    this.rafId = requestAnimationFrame(this.tick)
  }
}

export const gameLoop = new GameLoop()
