import { describe, expect, it } from "vitest";
import type { DdbCharacter, DdbSpell } from "../../src/types/character.js";
import { getAllSpells, getCharacterSpellEntries, getPreparedOrKnownSpells } from "../../src/utils/character-spells.js";

function createSpell(overrides: Partial<DdbSpell>): DdbSpell {
  return {
    id: 1,
    definition: {
      id: 123,
      name: "Misty Step",
      level: 2,
      school: "Conjuration",
      description: "Teleport a short distance.",
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
    usesSpellSlot: false,
    ...overrides,
  };
}

describe("character spell collections", () => {
  it("should merge duplicate spell flags instead of keeping the first record", () => {
    const character = {
      spells: {
        race: [],
        class: [],
        background: [],
        item: [],
        feat: [
          createSpell({ id: 1 }),
          createSpell({ id: 2, alwaysPrepared: true, usesSpellSlot: true }),
        ],
      },
      classSpells: [],
    } as unknown as DdbCharacter;

    const spells = getAllSpells(character);
    expect(spells).toHaveLength(1);
    expect(spells[0]).toMatchObject({ alwaysPrepared: true, usesSpellSlot: true });
    expect(getPreparedOrKnownSpells(character)).toHaveLength(1);
  });

  it("should treat classSpells membership as selected even with false prepared flags", () => {
    const shield = createSpell({
      id: 3,
      definition: {
        ...createSpell({}).definition,
        id: 456,
        name: "Shield",
        level: 1,
      },
    });
    const character = {
      spells: { race: [], class: [], background: [], item: [], feat: [] },
      classSpells: [{ entityTypeId: 1, characterClassId: 1, spells: [shield] }],
    } as unknown as DdbCharacter;

    expect(getPreparedOrKnownSpells(character).map((spell) => spell.definition.name))
      .toEqual(["Shield"]);
  });

  it("should include unprepared race, class-feature, and item spells with sources", () => {
    const mistyStep = createSpell({ id: 1 });
    const character = {
      spells: {
        race: [createSpell({
          id: 2,
          definition: { ...mistyStep.definition, id: 200, name: "Dancing Lights", level: 0 },
        })],
        class: [createSpell({
          id: 3,
          definition: { ...mistyStep.definition, id: 300, name: "Disguise Self", level: 1 },
        })],
        background: [],
        item: [createSpell({ id: 4 })],
        feat: [],
      },
      classSpells: [{ entityTypeId: 1, characterClassId: 1, spells: [mistyStep] }],
    } as unknown as DdbCharacter;

    const entries = getCharacterSpellEntries(character);
    expect(entries.map((entry) => entry.spell.definition.name)).toEqual([
      "Misty Step",
      "Disguise Self",
      "Dancing Lights",
    ]);
    expect(entries.find((entry) => entry.spell.definition.name === "Misty Step")?.sources)
      .toEqual(["Class", "Item"]);
    expect(getPreparedOrKnownSpells(character)).toHaveLength(3);
  });
});
