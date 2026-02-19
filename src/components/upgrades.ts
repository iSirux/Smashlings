import { defineComponent, Types } from 'bitecs'

// Track which items the player has collected (bitfield or array approach)
// Using a simple array approach via world state instead of ECS component
// since items are global to the run

export const ItemInventory = defineComponent({
  // Store up to 12 item slots as item IDs (0 = empty)
  slot0: Types.ui8,
  slot1: Types.ui8,
  slot2: Types.ui8,
  slot3: Types.ui8,
  slot4: Types.ui8,
  slot5: Types.ui8,
  slot6: Types.ui8,
  slot7: Types.ui8,
  slot8: Types.ui8,
  slot9: Types.ui8,
  slot10: Types.ui8,
  slot11: Types.ui8,
  slotCount: Types.ui8,  // how many slots are filled
  maxSlots: Types.ui8,   // max slots (default 6)
})

// Tag for shrine entities
export const IsShrine = defineComponent()

// Tag for chest entities
export const IsChest = defineComponent()

// Tag for gold coin pickups
export const IsGoldCoin = defineComponent()

// Interactable component - for things the player can interact with by proximity
export const Interactable = defineComponent({
  range: Types.f32,       // interaction range
  chargeTime: Types.f32,  // time needed to activate (0 = instant)
  chargeProgress: Types.f32, // current charge progress
  activated: Types.ui8,   // 1 if already activated
})
