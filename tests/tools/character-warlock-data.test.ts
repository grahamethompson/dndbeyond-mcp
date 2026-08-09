import { describe, expect, it, vi } from "vitest";
import type { DdbClient } from "../../src/api/client.js";
import type { DdbCharacter, DdbModifier, DdbSpell } from "../../src/types/character.js";
import { getCharacter } from "../../src/tools/character.js";

function makeSpell(name: string, level: number, definitionId: number): DdbSpell {
  return {
    id: definitionId * 10,
    definition: {
      id: definitionId,
      name,
      level,
      school: "Test",
      description: `${name} rules text.`,
      range: null,
      duration: null,
      activation: null,
      components: null,
      componentsDescription: null,
      concentration: false,
      ritual: false,
    },
    prepared: false,
    alwaysPrepared: false,
    usesSpellSlot: level > 0,
  };
}

function modifier(
  id: string,
  type: string,
  subType: string,
  value: number | null,
  name: string
): DdbModifier {
  return {
    id,
    type,
    subType,
    value,
    friendlyTypeName: type,
    friendlySubtypeName: name,
    componentId: 1,
    componentTypeId: 1,
  };
}

function createWarlockCharacter(): DdbCharacter {
  const selectedSpellData: Array<[string, number, number]> = [
    ["Eldritch Blast", 0, 1],
    ["Mage Hand", 0, 2],
    ["Prestidigitation", 0, 3],
    ["Hellish Rebuke", 1, 4],
    ["Mirror Image", 2, 5],
    ["Thunder Step", 3, 6],
    ["Fly", 3, 7],
    ["Hunger of Hadar", 3, 8],
    ["Shadow of Moil", 4, 9],
    ["Phantasmal Killer", 4, 10],
    ["Banishing Smite", 5, 11],
    ["Teleportation Circle", 5, 12],
    ["Danse Macabre", 5, 13],
  ];
  const selectedSpells = selectedSpellData.map(([name, level, id]) => makeSpell(name, level, id));

  return {
    id: 66658149,
    readonlyUrl: "",
    name: "Yasmine, The Black Handed",
    race: {
      fullName: "Drow Half-Elf",
      baseRaceName: "Half-Elf",
      isHomebrew: false,
      racialTraits: [],
      weightSpeeds: { normal: { walk: 30 } },
    },
    classes: [{
      id: 1,
      definition: { id: 7, name: "Warlock" },
      subclassDefinition: { name: "Hexblade", classFeatures: [] },
      level: 10,
      isStartingClass: true,
      classFeatures: [],
    }],
    background: { definition: null },
    stats: [
      { id: 1, value: 19 },
      { id: 2, value: 16 },
      { id: 3, value: 17 },
      { id: 4, value: 14 },
      { id: 5, value: 13 },
      { id: 6, value: 20 },
    ],
    bonusStats: [],
    overrideStats: [],
    baseHitPoints: 59,
    bonusHitPoints: null,
    overrideHitPoints: null,
    removedHitPoints: 29,
    temporaryHitPoints: 0,
    currentXp: 0,
    alignmentId: 0,
    lifestyleId: 0,
    currencies: { cp: 0, sp: 0, ep: 0, gp: 332, pp: 0 },
    spells: {
      race: [
        makeSpell("Dancing Lights", 0, 20),
        makeSpell("Faerie Fire", 1, 21),
        makeSpell("Darkness", 2, 22),
      ],
      class: [
        makeSpell("Disguise Self", 1, 23),
        makeSpell("Jump", 1, 24),
      ],
      background: [],
      item: [
        makeSpell("Detect Magic", 1, 25),
        makeSpell("Phantasmal Killer", 4, 26),
      ],
      feat: [],
    },
    classSpells: [{ entityTypeId: 1, characterClassId: 1, spells: selectedSpells }],
    inventory: [
      {
        id: 100,
        definition: {
          name: "Half Plate Armor",
          description: "Medium armor.",
          type: "Medium Armor",
          rarity: "Common",
          weight: 40,
          cost: 750,
          isHomebrew: false,
          armorClass: 15,
          armorTypeId: 2,
          filterType: "Armor",
        },
        equipped: true,
        quantity: 1,
      },
      {
        id: 315389880,
        definition: {
          name: "Ioun Stone of Reserve",
          description: "Stores spells.",
          type: "Wondrous Item",
          rarity: "Rare",
          weight: 0,
          cost: null,
          isHomebrew: false,
        },
        equipped: true,
        isAttuned: true,
        quantity: 1,
      },
    ],
    deathSaves: { failCount: null, successCount: null, isStabilized: false },
    traits: { personalityTraits: null, ideals: null, bonds: null, flaws: null, appearance: null },
    preferences: {},
    configuration: {},
    actions: {},
    modifiers: {
      race: [
        modifier("lang-common", "language", "common", null, "Common"),
        modifier("lang-elvish", "language", "elvish", null, "Elvish"),
        modifier("lang-infernal", "language", "infernal", null, "Infernal"),
        modifier("darkvision-60", "set-base", "darkvision", 60, "Darkvision"),
      ],
      class: [
        modifier("insight", "proficiency", "insight", null, "Insight"),
        modifier("darkvision-120", "set-base", "darkvision", 120, "Darkvision"),
      ],
      background: [modifier("lang-celestial", "language", "celestial", null, "Celestial")],
      feat: [modifier("alert", "bonus", "initiative", 5, "Initiative")],
      item: [],
    },
    campaign: null,
    feats: [],
    notes: { personalPossessions: null, backstory: null, otherNotes: null, allies: null, organizations: null },
    options: {
      class: [
        "Devil's Sight",
        "Mask of Many Faces",
        "Otherworldly Leap",
        "Relentless Hex",
        "Thirsting Blade",
        "Pact of the Blade",
      ].map((name, id) => ({ definition: { id, name, description: `${name} rules.` } })),
    },
    customProficiencies: [
      { name: "History - Molaesmyr", type: 1, statId: 4, proficiencyLevel: 3 },
      { name: "Custom Language 1", type: 3 },
      { name: "Custom Language 2", type: 3 },
    ],
    characterValues: [{ typeId: 8, valueId: "315389880", value: "Ioun stone" }],
    spellSlots: [
      { level: 1, used: 0, available: 0 },
      { level: 2, used: 0, available: 0 },
      { level: 3, used: 0, available: 0 },
      { level: 4, used: 0, available: 0 },
      { level: 5, used: 0, available: 0 },
    ],
    pactMagic: [
      { level: 1, used: 0, available: 0 },
      { level: 2, used: 0, available: 0 },
      { level: 3, used: 0, available: 0 },
      { level: 4, used: 0, available: 0 },
      { level: 5, used: 0, available: 0 },
    ],
  } as DdbCharacter;
}

function createMockClient(character: DdbCharacter): DdbClient {
  return {
    get: vi.fn().mockResolvedValue(character),
    getRaw: vi.fn(),
  } as unknown as DdbClient;
}

describe("legacy Warlock character data", () => {
  it("formats derived stats, pact magic, languages, options, and inventory metadata", async () => {
    const result = await getCharacter(createMockClient(createWarlockCharacter()), {
      characterId: 66658149,
      detail: "sheet",
    });
    const text = result.content[0].text;

    expect(text).toContain("HP: 60/89");
    expect(text).toContain("AC: 17");
    expect(text).toContain("Initiative: +8");
    expect(text).toContain("Passive Perception: 11 | Passive Insight: 15 | Passive Investigation: 12");
    expect(text).toContain("Senses: Darkvision 120 ft");
    expect(text).toContain("Languages: Celestial, Common, Custom Language 1, Custom Language 2, Elvish, Infernal");
    expect(text).toContain("History - Molaesmyr: +6 *");
    expect(text).toContain("Pact Magic (Level 5): ●● (0/2 used)");
    expect(text).toContain("Devil's Sight");
    expect(text).toContain("Pact of the Blade");
    expect(text).toContain("Ioun stone [attuned]");
  });

  it("includes all 20 spell rows (19 unique names) with source attribution", async () => {
    const result = await getCharacter(createMockClient(createWarlockCharacter()), {
      characterId: 66658149,
      detail: "full",
    });
    const text = result.content[0].text;

    expect(text.match(/^Character Sources:/gm)).toHaveLength(20);
    expect(text).toContain("Dancing Lights [Race]");
    expect(text).toContain("Disguise Self [Class feature]");
    expect(text).toContain("Detect Magic [Item]");
    expect(text).toContain("Phantasmal Killer [Class]");
    expect(text).toContain("Phantasmal Killer [Item]");
    expect(text.match(/^Phantasmal Killer \(Level 4 Test\)$/gm)).toHaveLength(2);
    expect(text).toContain("=== Selected Class Option Definitions ===");
    expect(text).toContain("Thirsting Blade (Selected Class Option)");
  });
});
