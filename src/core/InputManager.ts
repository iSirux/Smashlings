import * as THREE from 'three'

/**
 * Action-based keyboard input manager.
 *
 * Tracks raw key state via keydown/keyup and exposes high-level actions
 * (move, jump, dash) that game systems consume each frame.
 */

// Key bindings  ─  action → [positive key(s)]
const KEY_BINDINGS: Record<string, string[]> = {
  moveForward:  ['KeyW', 'ArrowUp'],
  moveBackward: ['KeyS', 'ArrowDown'],
  moveLeft:     ['KeyA', 'ArrowLeft'],
  moveRight:    ['KeyD', 'ArrowRight'],
  jump:         ['Space'],
  dash:         ['ShiftLeft', 'ShiftRight'],
}

class InputManager {
  // Raw held state keyed by KeyboardEvent.code
  private held = new Set<string>()

  // Edge-triggered flags (true for exactly one frame)
  jumpPressed = false
  dashPressed = false

  // Normalized XZ movement direction (updated each frame via update())
  readonly moveDirection = new THREE.Vector2()

  // Mouse delta accumulators (reset each frame)
  mouseX = 0
  mouseY = 0
  private _pointerLocked = false

  get isPointerLocked(): boolean {
    return this._pointerLocked
  }

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    // Prevent stuck keys when the window loses focus
    window.addEventListener('blur', this.onBlur)

    // Mouse input
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  requestPointerLock(canvas: HTMLCanvasElement): void {
    canvas.requestPointerLock()
  }

  // ── Axis helper ──────────────────────────────────────────────────────
  /**
   * Returns -1, 0, or 1 based on whether the positive or negative action
   * keys are held. If both are held, they cancel out to 0.
   */
  getAxis(positiveAction: string, negativeAction: string): number {
    const pos = this.isActionHeld(positiveAction) ? 1 : 0
    const neg = this.isActionHeld(negativeAction) ? 1 : 0
    return pos - neg
  }

  // ── Per-frame update ─────────────────────────────────────────────────
  /**
   * Call once per frame BEFORE systems read input.
   * Computes the normalized moveDirection vector from current key state.
   */
  update(): void {
    const x = this.getAxis('moveRight', 'moveLeft')
    const y = this.getAxis('moveForward', 'moveBackward')

    this.moveDirection.set(x, y)

    // Normalize only when length > 1 so that single-axis input stays at 1
    if (this.moveDirection.lengthSq() > 1) {
      this.moveDirection.normalize()
    }
  }

  /**
   * Call at the END of each frame so edge-triggered flags only last one tick.
   */
  resetEdgeTriggers(): void {
    this.jumpPressed = false
    this.dashPressed = false
    this.mouseX = 0
    this.mouseY = 0
  }

  // ── Internals ────────────────────────────────────────────────────────

  private isActionHeld(action: string): boolean {
    const codes = KEY_BINDINGS[action]
    if (!codes) return false
    for (let i = 0; i < codes.length; i++) {
      if (this.held.has(codes[i])) return true
    }
    return false
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    // Only fire edge triggers on the initial press, not on repeats
    if (!e.repeat) {
      if (!this.held.has(e.code)) {
        this.held.add(e.code)

        // Edge triggers
        if (KEY_BINDINGS.jump.includes(e.code)) {
          this.jumpPressed = true
        }
        if (KEY_BINDINGS.dash.includes(e.code)) {
          this.dashPressed = true
        }
      }
    }

    // Prevent default for game keys so the page doesn't scroll, etc.
    if (this.isGameKey(e.code)) {
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.held.delete(e.code)
  }

  private onMouseMove = (e: MouseEvent): void => {
    if (this._pointerLocked) {
      this.mouseX += e.movementX
      this.mouseY += e.movementY
    }
  }

  private onPointerLockChange = (): void => {
    this._pointerLocked = document.pointerLockElement !== null
  }

  private onBlur = (): void => {
    this.held.clear()
  }

  private isGameKey(code: string): boolean {
    for (const action in KEY_BINDINGS) {
      if (KEY_BINDINGS[action].includes(code)) return true
    }
    return false
  }

  /** Tear down event listeners (useful for tests / hot-reload). */
  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
  }
}

export const input = new InputManager()
