/**
 * Generic object pool to avoid GC pressure in hot paths.
 * Objects are created via `factory` and cleaned up via `reset` before reuse.
 */
export class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset: (obj: T) => void
  private _activeCount = 0

  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 0) {
    this.factory = factory
    this.reset = reset

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.factory())
    }
  }

  /**
   * Get an object from the pool (or create a new one if empty).
   */
  acquire(): T {
    this._activeCount++
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.factory()
  }

  /**
   * Return an object to the pool after resetting it.
   */
  release(obj: T): void {
    this._activeCount--
    this.reset(obj)
    this.pool.push(obj)
  }

  /**
   * Number of objects currently acquired (out of the pool).
   */
  get activeCount(): number {
    return this._activeCount
  }
}
