import { defineComponent } from 'bitecs'

/** Marks the single player entity. */
export const IsPlayer = defineComponent()

/** Marks all enemy entities. */
export const IsEnemy = defineComponent()

/** Marks projectile entities (player or enemy). */
export const IsProjectile = defineComponent()

/** Marks boss-type enemies. */
export const IsBoss = defineComponent()

/** Marks pickup entities (health, magnets, etc.). */
export const IsPickup = defineComponent()

/** Marks XP gem entities specifically. */
export const IsXPGem = defineComponent()

/** Marks projectiles fired by enemies (checked vs player, not enemies). */
export const IsEnemyProjectile = defineComponent()

/** Flag that tells the cleanup system to remove this entity at end of frame. */
export const DestroyFlag = defineComponent()
