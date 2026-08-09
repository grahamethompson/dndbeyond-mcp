/**
 * Shared character calculation utilities used by both tools and resources.
 * These are the canonical implementations for ability scores, AC, HP, and level.
 */

import type {
  DdbCharacter,
  DdbAbilityScore,
  DdbModifier,
} from "../types/character.js";

export const ABILITY_NAMES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

// Maps stat ID (1-6) to the subType prefix used in D&D Beyond modifiers
export const ABILITY_SUBTYPE_MAP: Record<number, string> = {
  1: "strength-score",
  2: "dexterity-score",
  3: "constitution-score",
  4: "intelligence-score",
  5: "wisdom-score",
  6: "charisma-score",
};

const ABILITY_SCORE_SUBTYPES = new Set(Object.values(ABILITY_SUBTYPE_MAP));

export function calculateAbilityModifier(score: number): string {
  const modifier = Math.floor((score - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export function sumModifierBonuses(
  modifiers: Record<string, DdbModifier[]>,
  subType: string
): number {
  let total = 0;
  for (const list of Object.values(modifiers)) {
    if (!Array.isArray(list)) continue;
    for (const mod of list) {
      if (mod.type === "bonus" && mod.subType === subType && mod.value != null) {
        total += mod.value;
      }
    }
  }
  return total;
}

export function computeFinalAbilityScore(
  base: DdbAbilityScore[],
  bonus: DdbAbilityScore[],
  override: DdbAbilityScore[],
  modifiers: Record<string, DdbModifier[]>,
  id: number
): number {
  const overrideValue = override.find((s) => s.id === id)?.value;
  if (overrideValue !== null && overrideValue !== undefined) return overrideValue;

  const baseValue = base.find((s) => s.id === id)?.value ?? 10;
  const bonusValue = bonus.find((s) => s.id === id)?.value ?? 0;
  const modifierBonus = sumModifierBonuses(modifiers, ABILITY_SUBTYPE_MAP[id] ?? "");
  let score = baseValue + bonusValue + modifierBonus;

  // Items such as a Belt of Giant Strength use a `set` modifier. D&D Beyond
  // applies the set value only when it would improve the calculated score.
  for (const list of Object.values(modifiers)) {
    if (!Array.isArray(list)) continue;
    for (const mod of list) {
      if (
        mod.type === "set" &&
        mod.subType === ABILITY_SUBTYPE_MAP[id] &&
        mod.value != null
      ) {
        score = Math.max(score, mod.value);
      }
    }
  }

  return score;
}

/**
 * Detects the compatibility shape produced when a character uses a 2024
 * background with a legacy species. The character service retains the old
 * species ASIs in `modifiers.race`, even though the D&D Beyond sheet correctly
 * uses only the background's ability-score choices.
 */
export function uses2024BackgroundAbilityScores(char: DdbCharacter): boolean {
  const backgroundName = char.background?.definition?.name.trim().toLowerCase();
  const expectedName = backgroundName
    ? `${backgroundName} ability score improvements`
    : null;

  return (char.feats ?? []).some((feat) => {
    const name = feat.definition.name.trim().toLowerCase();
    return name === "ability score improvements" || name === expectedName;
  });
}

/**
 * Context-aware ability score calculation. Prefer this over
 * `computeFinalAbilityScore` whenever the complete character is available.
 */
export function computeCharacterAbilityScore(char: DdbCharacter, id: number): number {
  let modifiers = char.modifiers ?? {};

  if (uses2024BackgroundAbilityScores(char) && Array.isArray(modifiers.race)) {
    modifiers = {
      ...modifiers,
      race: modifiers.race.filter((modifier) => !(
        modifier.type === "bonus"
        && ABILITY_SCORE_SUBTYPES.has(modifier.subType)
      )),
    };
  }

  return computeFinalAbilityScore(
    char.stats ?? [],
    char.bonusStats ?? [],
    char.overrideStats ?? [],
    modifiers,
    id
  );
}

export function computeLevel(char: DdbCharacter): number {
  return char.classes.reduce((sum, cls) => sum + cls.level, 0);
}

export function calculateMaxHp(char: DdbCharacter): number {
  const override = char.overrideHitPoints;
  if (override !== null && override !== undefined) return override;

  const base = char.baseHitPoints;
  const bonus = char.bonusHitPoints ?? 0;
  const level = Array.isArray(char.classes) ? computeLevel(char) : 0;
  const modifiers = char.modifiers ?? {};

  // Character-service v5 returns baseHitPoints before Constitution. D&D
  // Beyond applies the current Constitution modifier once per character level.
  const constitutionModifier = level > 0
    ? Math.floor((computeCharacterAbilityScore(char, 3) - 10) / 2)
    : 0;

  const flatModifierBonus = sumModifierBonuses(modifiers, "hit-points");
  const perLevelModifierBonus = sumModifierBonuses(modifiers, "hit-points-per-level") * level;

  return base
    + bonus
    + (constitutionModifier * level)
    + flatModifierBonus
    + perLevelModifierBonus;
}

export function calculateCurrentHp(char: DdbCharacter): number {
  const max = calculateMaxHp(char);
  return max - char.removedHitPoints;
}

export function calculateAc(char: DdbCharacter): number {
  const dexMod = Math.floor((computeCharacterAbilityScore(char, 2) - 10) / 2);
  const conMod = Math.floor((computeCharacterAbilityScore(char, 3) - 10) / 2);
  const wisMod = Math.floor((computeCharacterAbilityScore(char, 5) - 10) / 2);

  // Find equipped armor and shields
  let baseAc = 10;
  let armorType: "heavy" | "medium" | "light" | "none" = "none";
  let shieldBonus = 0;

  for (const item of char.inventory) {
    if (!item.equipped) continue;

    const itemType = item.definition.type?.toLowerCase() || "";
    const filterType = item.definition.filterType?.toLowerCase() || "";
    const armorTypeId = item.definition.armorTypeId;

    // Check for shield
    if (armorTypeId === 4 || itemType.includes("shield") || item.definition.baseArmorName?.toLowerCase() === "shield") {
      shieldBonus = item.definition.armorClass ?? 2;
      continue;
    }

    // Check for armor
    if (armorTypeId === 1 || armorTypeId === 2 || armorTypeId === 3 || itemType.includes("armor") || filterType === "armor") {
      const acValue = item.definition.armorClass ?? 10;

      if (armorTypeId === 3 || filterType.includes("heavy") || itemType.includes("heavy")) {
        baseAc = acValue;
        armorType = "heavy";
      } else if (armorTypeId === 2 || filterType.includes("medium") || itemType.includes("medium")) {
        baseAc = acValue;
        armorType = "medium";
      } else if (armorTypeId === 1 || filterType.includes("light") || itemType.includes("light")) {
        baseAc = acValue;
        armorType = "light";
      } else {
        // Default to light armor if type unclear
        baseAc = acValue;
        armorType = "light";
      }
    }
  }

  // Apply DEX modifier based on armor type
  let finalAc = baseAc;
  if (armorType === "none") {
    // Multiple AC calculations do not stack. Build every available unarmored
    // formula and use the highest result, matching D&D Beyond's sheet.
    const candidates = [10 + dexMod];
    const isBarbarian = char.classes.some(cls => cls.definition.name === "Barbarian");
    const isMonk = char.classes.some(cls => cls.definition.name === "Monk");

    if (isBarbarian) {
      candidates.push(10 + dexMod + conMod);
    }
    if (isMonk) {
      candidates.push(10 + dexMod + wisMod);
    }

    const modifierLists = Object.values(char.modifiers ?? {}).filter(Array.isArray);
    const naturalArmorValues = modifierLists
      .flat()
      .filter((mod) => mod.type === "set" && mod.subType === "unarmored-armor-class" && mod.value != null)
      .map((mod) => mod.value as number);

    if (naturalArmorValues.length > 0) {
      const ignoresDex = modifierLists
        .flat()
        .some((mod) => mod.type === "ignore" && mod.subType === "unarmored-dex-ac-bonus");
      const maxDexValues = modifierLists
        .flat()
        .filter((mod) => mod.type === "set" && mod.subType === "ac-max-dex-modifier" && mod.value != null)
        .map((mod) => mod.value as number);
      const maxDex = maxDexValues.length > 0 ? Math.min(...maxDexValues) : undefined;
      const naturalDex = ignoresDex
        ? 0
        : maxDex === undefined ? dexMod : Math.min(dexMod, maxDex);

      for (const value of naturalArmorValues) {
        // D&D Beyond represents natural AC as the amount above the standard
        // base of 10. Tortle Natural Armor therefore arrives as `set: 7`.
        candidates.push(10 + value + naturalDex);
      }
    }

    finalAc = Math.max(...candidates);
  } else if (armorType === "light") {
    finalAc = baseAc + dexMod;
  } else if (armorType === "medium") {
    finalAc = baseAc + Math.min(dexMod, 2);
  } else if (armorType === "heavy") {
    finalAc = baseAc; // No DEX bonus
  }

  // Add shield bonus
  finalAc += shieldBonus;

  // Add AC modifiers from features/spells
  const acBonus = sumModifierBonuses(char.modifiers, "armor-class")
    + (armorType === "none"
      ? sumModifierBonuses(char.modifiers, "unarmored-armor-class")
      : sumModifierBonuses(char.modifiers, "armored-armor-class"));

  finalAc += acBonus;

  return finalAc;
}
