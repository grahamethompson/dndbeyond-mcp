# Character spells and spell slots

## Spell record

The same general spell record appears in character spell collections and
game-data responses:

```ts
interface DdbSpell {
  id: number; // character spell record ID; not the definition identity
  definition: {
    id?: number;
    definitionKey?: string;
    name: string;
    level: number; // 0 = cantrip
    school: string;
    description: string; // HTML
    range: {
      origin: string;
      rangeValue: number | null;
      aoeType: string | null;
      aoeValue: number | null;
    } | null;
    duration: {
      durationInterval: number | null;
      durationUnit: string | null;
      durationType: string;
    } | null;
    activation: {
      activationTime: number;
      activationType: number;
    } | null;
    components: number[] | null;
    componentsDescription: string | null;
    concentration: boolean;
    ritual: boolean;
    isLegacy?: boolean;
    sources?: Array<{
      sourceId: number;
      pageNumber?: number | null;
      sourceType?: number;
    }>;
  };
  prepared: boolean;
  alwaysPrepared: boolean;
  usesSpellSlot: boolean;
}
```

Observed activation IDs used by the formatter include `1` for Action, `3` for
Bonus Action, and `6` for Reaction. Observed component IDs are `1` verbal, `2`
somatic, and `3` material. These are partial enum mappings, not an exhaustive
API contract.

## Character spell collections

Character-service distributes spells across several locations:

```ts
interface DdbSpellsContainer {
  race: DdbSpell[] | null;
  class: DdbSpell[] | null;
  background: DdbSpell[] | null;
  item: DdbSpell[] | null;
  feat: DdbSpell[] | null;
}

interface DdbClassSpellCollection {
  entityTypeId: number;
  characterClassId: number;
  spells: DdbSpell[];
}

interface DdbCharacter {
  spells: DdbSpellsContainer;
  classSpells?: DdbClassSpellCollection[];
}
```

The MCP assigns the following provenance labels:

| Raw location | Normalized source |
|---|---|
| `classSpells[].spells` | `Class` |
| `spells.class` | `Class feature` |
| `spells.race` | `Race` |
| `spells.background` | `Background` |
| `spells.item` | `Item` |
| `spells.feat` | `Feat` |

## `prepared` is not an availability filter

**Observed and verified:** D&D Beyond can return `prepared: false` for spells
that are still present on the character sheet, including:

- a Warlock's selected class spells;
- racial spells;
- spells granted by invocations or other class options;
- item-granted spells.

Presence in a character spell collection means the spell is attached to the
character. The `prepared` flag must be preserved, but it must not be used as the
sole filter for MCP spell-list output.

## Identity, deduplication, and rules versions

Use definition identity in this order:

1. `definition.id`
2. `definition.definitionKey`
3. normalized `name + level` only as a last-resort fallback

Do not deduplicate by display name. A validated legacy character returned two
records named Phantasmal Killer:

- a legacy definition from the class spell collection;
- a current definition granted by an item.

The exported character PDF displayed 20 spell rows with 19 unique names. The
correct normalized result retains both definition records and their separate
source attribution.

When the same definition identity appears in multiple collections, merge the
records while OR-ing `prepared`, `alwaysPrepared`, and `usesSpellSlot`, and
retain every distinct source label.

## Normalized spell entry

The current normalization boundary is:

```ts
interface CharacterSpellEntry {
  spell: DdbSpell;
  sources: string[];
}
```

A future canonical model should also make these interpretations explicit:

```ts
interface NormalizedCharacterSpell {
  definitionId: string;
  name: string;
  level: number;
  rulesVersion: "legacy" | "current" | "unknown";
  sources: Array<"class" | "class-feature" | "race" | "background" | "item" | "feat">;
  prepared: boolean;
  alwaysPrepared: boolean;
  usesSpellSlot: boolean;
}
```

## Regular spell slots

```ts
interface DdbSpellSlot {
  level: number;
  used: number;
  available: number;
}
```

The array can contain placeholder rows with `available: 0`. Display only levels
that actually have slots, but preserve zero-valued rows at the raw API boundary.

## Pact Magic payload variants

### Compatibility object

Older payloads and fixtures used one object:

```json
{
  "level": 3,
  "used": 1,
  "available": 2
}
```

### Current level-indexed array

**Observed** on character-service v5 for a level-10 Warlock:

```json
[
  { "level": 1, "used": 0, "available": 0 },
  { "level": 2, "used": 0, "available": 0 },
  { "level": 3, "used": 0, "available": 0 },
  { "level": 4, "used": 0, "available": 0 },
  { "level": 5, "used": 0, "available": 0 }
]
```

The active row's `used` value is meaningful, but `available` can remain zero.
The MCP derives the active pact slot level and count from total Warlock level:

| Warlock level | Slot level | Slots |
|---:|---:|---:|
| 1 | 1 | 1 |
| 2 | 1 | 2 |
| 3–4 | 2 | 2 |
| 5–6 | 3 | 2 |
| 7–8 | 4 | 2 |
| 9–10 | 5 | 2 |
| 11–16 | 5 | 3 |
| 17–20 | 5 | 4 |

Normalized output:

```ts
interface PactMagicState {
  level: number;
  used: number;
  available: number;
}
```

The write endpoint expects the active slot level in the property name:

```http
PUT /character/v5/spell/pact-magic
Content-Type: application/json

{
  "characterId": 12345,
  "level5": 1
}
```

## Open cast-semantics question

Source attribution and cast mechanics are separate concerns. The presence of an
item-granted spell does not by itself prove that casting it should consume a
regular or Pact Magic slot; an item may use charges or provide another casting
rule. A future cast normalizer should model `castMethod` explicitly and should
not infer slot expenditure from the spell's name or level alone.

