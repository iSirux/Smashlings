import { defineComponent, Types } from 'bitecs'

/** Entity self-destructs when `remaining` reaches 0. */
export const Lifetime = defineComponent({
  remaining: Types.f32,
})

/** How much XP this entity is worth when collected/killed. */
export const XPValue = defineComponent({
  amount: Types.f32,
})

/** Index into the ENEMIES data array for enemy configuration lookup. */
export const EnemyType = defineComponent({
  id: Types.ui8,
})
