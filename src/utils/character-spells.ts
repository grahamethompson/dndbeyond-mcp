import type { DdbCharacter, DdbSpell } from "../types/character.js";

export interface CharacterSpellEntry {
  spell: DdbSpell;
  sources: string[];
}

export function getSpellKey(spell: DdbSpell): string {
  return String(
    spell.definition?.id
      ?? spell.definition?.definitionKey
      ?? `${spell.definition?.name ?? "unknown"}:${spell.definition?.level ?? "unknown"}`
  );
}

/**
 * Return every spell attached to the character, merging duplicate records from
 * D&D Beyond's spell collections without losing flags or source attribution.
 *
 * Character-service v5 uses `prepared: false` for several spells that are
 * nevertheless available through a race, feat, item, invocation, or a
 * Warlock's known-spell list. Presence in one of these collections is therefore
 * the reliable signal that the spell belongs on the character sheet.
 */
export function getCharacterSpellEntries(char: DdbCharacter): CharacterSpellEntry[] {
  const collections: Array<{ source: string; spells: DdbSpell[] }> = [
    {
      source: "Class",
      spells: (char.classSpells ?? []).flatMap((entry) => entry.spells ?? []),
    },
    { source: "Class feature", spells: char.spells.class ?? [] },
    { source: "Race", spells: char.spells.race ?? [] },
    { source: "Background", spells: char.spells.background ?? [] },
    { source: "Item", spells: char.spells.item ?? [] },
    { source: "Feat", spells: char.spells.feat ?? [] },
  ];

  const merged = new Map<string, CharacterSpellEntry>();
  for (const { source, spells } of collections) {
    for (const spell of spells) {
      const key = getSpellKey(spell);
      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, { spell, sources: [source] });
        continue;
      }

      merged.set(key, {
        spell: {
          ...existing.spell,
          prepared: existing.spell.prepared || spell.prepared,
          alwaysPrepared: existing.spell.alwaysPrepared || spell.alwaysPrepared,
          usesSpellSlot: existing.spell.usesSpellSlot || spell.usesSpellSlot,
        },
        sources: existing.sources.includes(source)
          ? existing.sources
          : [...existing.sources, source],
      });
    }
  }

  return [...merged.values()];
}

export function getAllSpells(char: DdbCharacter): DdbSpell[] {
  return getCharacterSpellEntries(char).map((entry) => entry.spell);
}

export function getAvailableSpells(char: DdbCharacter): DdbSpell[] {
  return getAllSpells(char);
}

/** Compatibility alias retained for callers using the original helper name. */
export function getPreparedOrKnownSpells(char: DdbCharacter): DdbSpell[] {
  return getAvailableSpells(char);
}
