import { describe, it, expect, vi, beforeEach } from "vitest";
import { longRest, shortRest } from "../../src/tools/character.js";
import type { DdbClient } from "../../src/api/client.js";

describe("longRest", () => {
  let mockClient: DdbClient;

  beforeEach(() => {
    mockClient = {
      post: vi.fn().mockResolvedValue({}),
    } as unknown as DdbClient;
  });

  it("should call server-side long rest endpoint and invalidate cache", async () => {
    const result = await longRest(mockClient, { characterId: 123 });

    expect(result.content[0].text).toContain("Long rest completed for character 123");
    expect(result.content[0].text).toContain("HP, spell slots, and long-rest abilities have been restored");

    // Should call the server-side rest endpoint
    expect(mockClient.post).toHaveBeenCalledWith(
      expect.stringContaining("/character/v5/character/rest/long"),
      { characterId: 123, resetMaxHpModifier: true, adjustConditionLevel: false },
      ["character:123"]
    );
  });
});

describe("shortRest", () => {
  let mockClient: DdbClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn().mockResolvedValue({ classes: [{ id: 77, hitDiceUsed: 2 }] }),
      post: vi.fn().mockResolvedValue({}),
    } as unknown as DdbClient;
  });

  it("should call server-side short rest endpoint and invalidate cache", async () => {
    const result = await shortRest(mockClient, { characterId: 123 });

    expect(result.content[0].text).toContain("Short rest completed for character 123");
    expect(result.content[0].text).toContain("Pact magic and short-rest abilities have been restored");

    // Should call the server-side rest endpoint
    expect(mockClient.post).toHaveBeenCalledWith(
      expect.stringContaining("/character/v5/character/rest/short"),
      { characterId: 123, classHitDiceUsed: { 77: 2 }, resetMaxHpModifier: false },
      ["character:123"]
    );
  });
});
