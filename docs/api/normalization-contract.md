# MCP normalization contract

## Goal

D&D Beyond can represent the same gameplay concept in different locations or
payload shapes. The normalization layer should absorb those differences once so
every MCP tool and resource uses the same interpretation.

```text
D&D Beyond service payload
            ↓
transport envelope handling
            ↓
raw service types
            ↓
normalization and derivation
            ↓
canonical character data
            ↓
MCP tools, resources, prompts, and write validation
```

## Boundary rules

1. Preserve raw identities and provenance before combining records.
2. Normalize equivalent structural variants into one canonical shape.
3. Do not collapse records that differ by definition identity or rules version.
4. Keep factual API fields separate from derived values.
5. Include the derivation inputs in tests whenever possible.
6. Make list availability separate from castability or resource expenditure.
7. Use the same canonical functions for summary, sheet, full, and resource
   output.
8. Keep compatibility handling at the normalization boundary, not scattered
   through formatters.

## Current normalizers

| Concern | Implementation | Canonical result |
|---|---|---|
| Ability scores, HP, AC, level | `src/utils/character-calculations.ts` | Derived numeric values |
| Character spells and provenance | `src/utils/character-spells.ts` | `CharacterSpellEntry[]` |
| Pact Magic variants | `src/utils/character-spell-slots.ts` | `PactMagicState` |
| Inventory custom names | `src/utils/character-inventory.ts` | Display label/name selection |

The project does not yet have one complete `NormalizedCharacter` object. These
focused normalizers are the first stage of that design.

## Recommended canonical structures

```ts
interface NormalizedCharacter {
  identity: {
    id: string;
    name: string;
    readonlyUrl: string;
  };
  level: number;
  proficiencyBonus: number;
  abilities: Record<AbilityName, NormalizedAbility>;
  defenses: NormalizedDefenses;
  movement: NormalizedMovement;
  senses: NormalizedSense[];
  proficiencies: NormalizedProficiencies;
  spells: NormalizedCharacterSpell[];
  spellcasting: NormalizedSpellcasting[];
  inventory: NormalizedInventoryItem[];
  features: NormalizedFeature[];
  resources: NormalizedResource[];
}
```

Every normalized value that is not directly supplied by the API should be able
to report its provenance:

```ts
interface DerivedValue<T> {
  value: T;
  inputs: string[];
  warnings?: string[];
}
```

This does not require exposing derivation metadata in normal MCP output. It
provides a consistent basis for diagnostics and regression tests.

## Identity rules

| Entity | Primary identity | Fallback |
|---|---|---|
| Spell | `definition.id` | `definition.definitionKey`, then name + level |
| Inventory instance | `inventory[].id` | None currently documented |
| Class mapping | `classes[].id` | None; definition ID is a different concept |
| Class definition | `classes[].definition.id` | Name for display only |
| Feature/action | API ID plus entity/component type where supplied | Name only for fuzzy user lookup |

Never use a display name as the primary identity when the API supplies a
definition or instance ID.

## Empty, false, and zero values

Normalization must not treat these values as equivalent:

- `undefined`: the field was not returned or is from an older shape;
- `null`: the API explicitly returned no value;
- `[]`: the collection was returned and is empty;
- `false`: a real flag value, not proof that the record is unavailable;
- `0`: sometimes a meaningful value and sometimes a placeholder requiring a
  documented derivation, as with current Pact Magic `available` rows.

## Rules-version preservation

`definition.isLegacy` and definition identity must survive normalization. When
two records have the same name but different identities or legacy status, retain
both. A formatter may label or prefer one version for a specific request, but
the canonical data must not discard the alternative.

## Read and write separation

Read normalization does not automatically authorize a write. Write tools should
validate against canonical state, then map the requested change back to the
specific raw endpoint contract.

Examples:

- normalized Pact Magic identifies the active slot level, while the API write
  body uses a dynamic `levelN` property;
- normalized currency uses `cp`/`sp`/`ep`/`gp`/`pp`, while write URLs use full
  coin names;
- a normalized item spell may be listable but still lack enough information to
  determine whether casting consumes a slot or item charge.

## Regression fixture requirements

When documenting and implementing a new payload variant, add a minimal sanitized
fixture that proves:

- the raw variant is accepted;
- the canonical result is stable;
- meaningful identities and provenance survive;
- equivalent MCP output paths agree;
- no live write is required for validation.

