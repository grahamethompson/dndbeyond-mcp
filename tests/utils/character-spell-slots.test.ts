import { describe, expect, it } from "vitest";
import type { DdbCharacter } from "../../src/types/character.js";
import { getPactMagicState } from "../../src/utils/character-spell-slots.js";

describe("getPactMagicState", () => {
  it("supports the legacy single-object payload", () => {
    const character = {
      classes: [{ definition: { name: "Warlock" }, level: 5 }],
      pactMagic: { level: 3, used: 1, available: 2 },
    } as DdbCharacter;

    expect(getPactMagicState(character)).toEqual({ level: 3, used: 1, available: 2 });
  });

  it("derives level-5 slots for a level-10 Warlock from the v5 array payload", () => {
    const character = {
      classes: [{ definition: { name: "Warlock" }, level: 10 }],
      pactMagic: [
        { level: 1, used: 0, available: 0 },
        { level: 2, used: 0, available: 0 },
        { level: 3, used: 0, available: 0 },
        { level: 4, used: 0, available: 0 },
        { level: 5, used: 1, available: 0 },
      ],
    } as DdbCharacter;

    expect(getPactMagicState(character)).toEqual({ level: 5, used: 1, available: 2 });
  });
});
