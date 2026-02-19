// ---- Event type map ----

export type GameEvents = {
  'entity:died': { eid: number; x: number; y: number; z: number; wasEnemy: boolean }
  'entity:damaged': { eid: number; amount: number; x: number; y: number; z: number; isCrit: boolean }
  'player:levelup': { level: number }
  'player:died': { timeAlive: number; kills: number }
  'pickup:collected': { eid: number; type: string; value: number }
  'wave:started': { waveNumber: number }
  'enemy:spawned': { eid: number }
  'boss:spawned': { eid: number; bossId: string }
  'boss:defeated': { eid: number }
  'shrine:activated': { stat: string; value: number; label: string; x: number; y: number; z: number }
  'item:collected': { itemId: string; name: string; rarity: string; x: number; y: number; z: number }
  'swarm:started': Record<string, never>
  'game:start': Record<string, never>
  'game:pause': Record<string, never>
  'game:resume': Record<string, never>
}

// ---- Implementation ----

type Handler<T> = (data: T) => void

class EventBusClass {
  private listeners = new Map<string, Set<Handler<unknown>>>()

  /**
   * Subscribe to an event. The handler will be called every time the event
   * is emitted until it is removed via `off`.
   */
  on<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    let set = this.listeners.get(event as string)
    if (!set) {
      set = new Set()
      this.listeners.set(event as string, set)
    }
    set.add(handler as Handler<unknown>)
  }

  /**
   * Unsubscribe a previously registered handler.
   */
  off<K extends keyof GameEvents>(event: K, handler: Handler<GameEvents[K]>): void {
    const set = this.listeners.get(event as string)
    if (set) {
      set.delete(handler as Handler<unknown>)
      if (set.size === 0) {
        this.listeners.delete(event as string)
      }
    }
  }

  /**
   * Emit an event, synchronously invoking all registered handlers.
   */
  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    const set = this.listeners.get(event as string)
    if (set) {
      for (const handler of set) {
        handler(data)
      }
    }
  }

  /**
   * Remove every handler for every event.
   */
  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBusClass()
