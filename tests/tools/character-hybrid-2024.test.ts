import { describe, expect, it, vi } from "vitest";
import type { DdbClient } from "../../src/api/client.js";
import type { DdbCharacter, DdbModifier } from "../../src/types/character.js";
import { getCharacter } from "../../src/tools/character.js";

function modifier(
  id: string,
  type: string,
  subType: string,
  value: number | null,
  componentId = 1
): DdbModifier {
  return {
    id,
    type,
    subType,
    value,
    friendlyTypeName: type,
    friendlySubtypeName: subType,
    componentId,
    componentTypeId: 1,
  };
}

function createHybridCharacter(): DdbCharacter {
  return {
    id: 100,
    readonlyUrl: "",
    name: "Hybrid Hero",
    race: {
      fullName: "Fairy",
      baseRaceName: "Fairy",
      isHomebrew: false,
      racialTraits: [],
      weightSpeeds: { normal: { walk: 30, fly: 0 } },
    },
    classes: [{
      id: 1,
      definition: { id: 2190875, name: "Barbarian" },
      subclassDefinition: { name: "Path of Wild Magic", classFeatures: [] },
      level: 6,
      isStartingClass: true,
      classFeatures: [],
    }],
    background: {
      definition: {
        name: "Guide",
        description: "",
        featureName: null,
        featureDescription: null,
        snippet: null,
        skillProficienciesDescription: null,
        toolProficienciesDescription: null,
        equipmentDescription: null,
      },
    },
    // The service retains the legacy Fairy ASIs alongside the 2024 Guide ASI.
    stats: [
      { id: 1, value: 17 },
      { id: 2, value: 12 },
      { id: 3, value: 14 },
      { id: 4, value: 10 },
      { id: 5, value: 11 },
      { id: 6, value: 11 },
    ],
    bonusStats: [],
    overrideStats: [],
    baseHitPoints: 57,
    bonusHitPoints: null,
    overrideHitPoints: null,
    removedHitPoints: 0,
    temporaryHitPoints: 0,
    currentXp: 0,
    alignmentId: 0,
    lifestyleId: 0,
    currencies: { cp: 9, sp: 4, ep: 0, gp: 300, pp: 0 },
    spells: { race: [], class: [], background: [], item: [], feat: [] },
    inventory: [{
      id: 10,
      definition: {
        name: "Ring of Protection",
        description: "",
        type: "Ring",
        rarity: "Rare",
        weight: 0,
        cost: null,
        isHomebrew: false,
      },
      equipped: true,
      isAttuned: true,
      quantity: 1,
    }],
    customItems: [{
      id: 20,
      name: "Signet Ring",
      description: null,
      weight: 0,
      cost: 5,
      quantity: 1,
    }],
    deathSaves: { failCount: null, successCount: null, isStabilized: false },
    traits: { personalityTraits: null, ideals: null, bonds: null, flaws: null, appearance: null },
    preferences: {},
    configuration: {},
    actions: {
      class: [
        {
          id: 1,
          entityTypeId: 1,
          name: "Rage",
          componentId: 1,
          componentTypeId: 1,
          limitedUse: { maxUses: 4, numberUsed: 1, resetType: 2, resetTypeDescription: "Long Rest" },
        },
        {
          id: 2,
          entityTypeId: 1,
          name: "Magic Awareness",
          componentId: 2,
          componentTypeId: 1,
          limitedUse: { maxUses: 0, numberUsed: 1, useProficiencyBonus: true, resetType: 2, resetTypeDescription: "Long Rest" },
        },
        {
          id: 3,
          entityTypeId: 1,
          name: "Bolstering Magic",
          componentId: 3,
          componentTypeId: 1,
          limitedUse: { maxUses: 0, numberUsed: 2, useProficiencyBonus: true, resetType: 2, resetTypeDescription: "Long Rest" },
        },
      ],
    },
    modifiers: {
      race: [
        modifier("legacy-dex", "bonus", "dexterity-score", 2),
        modifier("legacy-con", "bonus", "constitution-score", 1),
        modifier("flight", "set", "innate-speed-flying", 30),
      ],
      class: [
        modifier("speed", "bonus", "speed", 10),
        modifier("str-save", "proficiency", "strength-saving-throws", null),
        modifier("con-save", "proficiency", "constitution-saving-throws", null),
      ],
      background: [
        modifier("nature", "proficiency", "nature", null),
        modifier("perception", "proficiency", "perception", null),
        modifier("stealth", "proficiency", "stealth", null),
      ],
      feat: [
        modifier("guide-wis", "bonus", "wisdom-score", 2),
        modifier("guide-dex", "bonus", "dexterity-score", 1),
        modifier("sentinel-dex", "bonus", "dexterity-score", 1),
      ],
      item: [
        modifier("ring-ac", "bonus", "armor-class", 1),
        modifier("ring-saves", "bonus", "saving-throws", 1),
      ],
    },
    campaign: null,
    feats: [
      {
        definition: { name: "Guide Ability Score Improvements", description: "", snippet: null, prerequisite: null },
        componentId: 1,
        componentTypeId: 1,
      },
      {
        definition: { name: "Sentinel", description: "", snippet: null, prerequisite: null },
        componentId: 2,
        componentTypeId: 1,
      },
    ],
    notes: { personalPossessions: null, backstory: null, otherNotes: null, allies: null, organizations: null },
    options: {
      race: [{ definition: { name: "Wisdom" } }],
      feat: [
        { definition: { name: "Greataxe / Cleave" } },
        { definition: { name: "Trident / Topple" } },
      ],
    },
  };
}

describe("2024 character with legacy species data", () => {
  it("normalizes derived stats, movement, resources, choices, and custom items", async () => {
    const client = {
      get: vi.fn().mockResolvedValue(createHybridCharacter()),
      getRaw: vi.fn(),
    } as unknown as DdbClient;

    const result = await getCharacter(client, { characterId: 100, detail: "sheet" });
    const text = result.content[0].text;

    expect(text).toContain("HP: 69/69");
    expect(text).toContain("AC: 15");
    expect(text).toContain("Speed: 40 ft walking, 40 ft flying");
    expect(text).toContain("Initiative: +2");
    expect(text).toContain("STR: 17 (+3) | DEX: 14 (+2) | CON: 14 (+2) | INT: 10 (+0) | WIS: 13 (+1) | CHA: 11 (+0)");
    expect(text).toContain("STR: +7 * | DEX: +3 | CON: +6 * | INT: +1 | WIS: +2 | CHA: +1");
    expect(text).toContain("Nature: +3 *");
    expect(text).toContain("Perception: +4 *");
    expect(text).toContain("Stealth: +5 *");
    expect(text).toContain("Rage: 3/4 (Long Rest)");
    expect(text).toContain("Magic Awareness: 2/3 (Long Rest)");
    expect(text).toContain("Bolstering Magic: 1/3 (Long Rest)");
    expect(text).toContain("Race: Wisdom");
    expect(text).toContain("Feat: Greataxe / Cleave, Trident / Topple");
    expect(text).toContain("Ring of Protection [attuned]");
    expect(text).toContain("Signet Ring");
  });
});
