import type { DdbCharacter } from "../types/character.js";

export interface PactMagicState {
  level: number;
  used: number;
  available: number;
}

function getWarlockPactSlotCount(level: number): number {
  if (level < 1) return 0;
  if (level === 1) return 1;
  if (level < 11) return 2;
  if (level < 17) return 3;
  return 4;
}

/**
 * Normalize the two pact-magic shapes returned by D&D Beyond. Older payloads
 * expose one object; character-service v5 currently exposes one row per spell
 * level and leaves `available` at zero, so the slot level/count must be derived
 * from the character's Warlock level.
 */
export function getPactMagicState(char: DdbCharacter): PactMagicState | null {
  const pactMagic = char.pactMagic;
  if (pactMagic && !Array.isArray(pactMagic)) {
    return pactMagic.available > 0 ? pactMagic : null;
  }

  const warlockLevel = char.classes
    .filter((cls) => cls.definition.name.toLowerCase() === "warlock")
    .reduce((total, cls) => total + cls.level, 0);
  if (warlockLevel === 0 || !Array.isArray(pactMagic)) return null;

  const level = Math.min(Math.ceil(warlockLevel / 2), 5);
  const row = pactMagic.find((slot) => slot.level === level);
  return {
    level,
    used: row?.used ?? 0,
    available: row && row.available > 0
      ? row.available
      : getWarlockPactSlotCount(warlockLevel),
  };
}
