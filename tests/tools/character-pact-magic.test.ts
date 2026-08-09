import { describe, it, expect, vi, beforeEach } from "vitest";
import { castSpell, updatePactMagic } from "../../src/tools/character.js";
import type { DdbClient } from "../../src/api/client.js";

describe("updatePactMagic", () => {
  let mockClient: DdbClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({ pactMagic: { level: 3, used: 0, available: 2 } }),
      getRaw: vi.fn(),
      put: vi.fn(),
    };
  });

  it("should update pact magic slots", async () => {
    const result = await updatePactMagic(mockClient, {
      characterId: 123,
      used: 1,
    });

    expect(mockClient.put).toHaveBeenCalledWith(
      "https://character-service.dndbeyond.com/character/v5/spell/pact-magic",
      { characterId: 123, level3: 1 },
      ["character:123"]
    );

    expect(result.content[0].text).toBe("Updated pact magic slots to 1 used.");
  });

  it("should reject negative used slots", async () => {
    const result = await updatePactMagic(mockClient, {
      characterId: 123,
      used: -1,
    });

    expect(result.content[0].text).toBe("Used pact magic slots cannot be negative.");
    expect(mockClient.put).not.toHaveBeenCalled();
  });

  it("should allow resetting to 0", async () => {
    const result = await updatePactMagic(mockClient, {
      characterId: 123,
      used: 0,
    });

    expect(mockClient.put).toHaveBeenCalledWith(
      "https://character-service.dndbeyond.com/character/v5/spell/pact-magic",
      { characterId: 123, level3: 0 },
      ["character:123"]
    );

    expect(result.content[0].text).toBe("Updated pact magic slots to 0 used.");
  });

  it("should update the active level from the v5 array payload", async () => {
    vi.mocked(mockClient.get).mockResolvedValue({
      classes: [{ definition: { name: "Warlock" }, level: 10 }],
      pactMagic: [
        { level: 1, used: 0, available: 0 },
        { level: 2, used: 0, available: 0 },
        { level: 3, used: 0, available: 0 },
        { level: 4, used: 0, available: 0 },
        { level: 5, used: 0, available: 0 },
      ],
    });

    await updatePactMagic(mockClient, { characterId: 123, used: 1 });

    expect(mockClient.put).toHaveBeenCalledWith(
      "https://character-service.dndbeyond.com/character/v5/spell/pact-magic",
      { characterId: 123, level5: 1 },
      ["character:123"]
    );
  });

  it("should cast using a pact slot from the v5 array payload", async () => {
    vi.mocked(mockClient.get).mockResolvedValue({
      classes: [{ definition: { name: "Warlock" }, level: 10 }],
      spells: { race: [], class: [], background: [], item: [], feat: [] },
      classSpells: [{
        spells: [{
          id: 1,
          definition: { id: 1, name: "Fly", level: 3 },
          prepared: false,
          alwaysPrepared: false,
          usesSpellSlot: true,
        }],
      }],
      pactMagic: [
        { level: 1, used: 0, available: 0 },
        { level: 2, used: 0, available: 0 },
        { level: 3, used: 0, available: 0 },
        { level: 4, used: 0, available: 0 },
        { level: 5, used: 1, available: 0 },
      ],
    });

    const result = await castSpell(mockClient, { characterId: 123, spellName: "Fly" });

    expect(mockClient.put).toHaveBeenCalledWith(
      "https://character-service.dndbeyond.com/character/v5/spell/pact-magic",
      { characterId: 123, level5: 2 },
      ["character:123"]
    );
    expect(result.content[0].text).toContain("Pact slots: 2/2 used");
  });
});
