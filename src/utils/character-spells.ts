import type { DdbCharacter, DdbSpell } from "../types/character.js";

export interface CharacterSpellEntry {
  spell: DdbSpell;
  sources: string[];
  castingModes: CharacterSpellCastingMode[];
}

export interface CharacterSpellCastingMode {
  source: string;
  usesSpellSlot: boolean;
  limitedUse: DdbSpell["limitedUse"];
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
      const castingMode: CharacterSpellCastingMode = {
        source,
        usesSpellSlot: spell.usesSpellSlot,
        limitedUse: spell.limitedUse,
      };
      if (!existing) {
        merged.set(key, { spell, sources: [source], castingModes: [castingMode] });
        continue;
      }

      const modeKey = JSON.stringify({
        source: castingMode.source,
        usesSpellSlot: castingMode.usesSpellSlot,
        maxUses: castingMode.limitedUse?.maxUses ?? null,
        resetType: castingMode.limitedUse?.resetType ?? null,
      });
      const castingModes = existing.castingModes.some((mode) => JSON.stringify({
        source: mode.source,
        usesSpellSlot: mode.usesSpellSlot,
        maxUses: mode.limitedUse?.maxUses ?? null,
        resetType: mode.limitedUse?.resetType ?? null,
      }) === modeKey)
        ? existing.castingModes
        : [...existing.castingModes, castingMode];

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
        castingModes,
      });
    }
  }

  return [...merged.values()];
}

const RESET_NAMES: Record<number, string> = {
  1: "Short Rest",
  2: "Long Rest",
  3: "Dawn",
  4: "Other",
};

/** Describe every way the character can cast a normalized spell entry. */
export function formatCharacterSpellAccess(entry: CharacterSpellEntry): string {
  const hasLimitedUse = entry.castingModes.some((mode) => mode.limitedUse != null);
  if (!hasLimitedUse && entry.castingModes.length <= 1) {
    return entry.sources.join(", ");
  }

  const access = entry.castingModes.flatMap((mode) => {
    if (mode.limitedUse) {
      const reset = mode.limitedUse.resetTypeDescription
        || RESET_NAMES[mode.limitedUse.resetType]
        || "Other";
      const uses = mode.limitedUse.useProficiencyBonus
        ? "PB"
        : String(mode.limitedUse.maxUses);
      return [`${uses}/${reset}`];
    }
    if (mode.usesSpellSlot) return ["spell slots"];
    if (entry.spell.definition.level > 0) return ["at will"];
    return [];
  });
  const uniqueAccess = [...new Set(access)];
  const sourceText = entry.sources.join(", ");
  return uniqueAccess.length > 0
    ? `${sourceText}; ${uniqueAccess.join(" + ")}`
    : sourceText;
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
