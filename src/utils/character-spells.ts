import type { DdbCharacter, DdbSpell } from "../types/character.js";

export function getSpellKey(spell: DdbSpell): string {
  return String(
    spell.definition?.id
      ?? spell.definition?.definitionKey
      ?? `${spell.definition?.name ?? "unknown"}:${spell.definition?.level ?? "unknown"}`
  );
}

/**
 * Return every spell attached to the character, merging duplicate records from
 * D&D Beyond's spell collections without losing prepared/castability flags.
 */
export function getAllSpells(char: DdbCharacter): DdbSpell[] {
  const spells = [
    ...(char.spells.class ?? []),
    ...(char.spells.race ?? []),
    ...(char.spells.background ?? []),
    ...(char.spells.item ?? []),
    ...(char.spells.feat ?? []),
    ...(char.classSpells ?? []).flatMap((entry) => entry.spells ?? []),
  ];

  const merged = new Map<string, DdbSpell>();
  for (const spell of spells) {
    const key = getSpellKey(spell);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, spell);
      continue;
    }

    merged.set(key, {
      ...existing,
      prepared: existing.prepared || spell.prepared,
      alwaysPrepared: existing.alwaysPrepared || spell.alwaysPrepared,
      usesSpellSlot: existing.usesSpellSlot || spell.usesSpellSlot,
    });
  }

  return [...merged.values()];
}

/**
 * D&D Beyond stores selected spells for known/prepared casters in
 * `classSpells`, but currently marks those records as `prepared: false`.
 * Membership in that collection is therefore authoritative alongside the
 * normal prepared flags.
 */
export function getPreparedOrKnownSpells(char: DdbCharacter): DdbSpell[] {
  const selectedClassSpellKeys = new Set(
    (char.classSpells ?? [])
      .flatMap((entry) => entry.spells ?? [])
      .map(getSpellKey)
  );

  return getAllSpells(char).filter(
    (spell) =>
      spell.prepared
      || spell.alwaysPrepared
      || selectedClassSpellKeys.has(getSpellKey(spell))
  );
}
