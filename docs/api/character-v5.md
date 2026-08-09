# Character-service v5 character payload

## Endpoint

```http
GET https://character-service.dndbeyond.com/character/v5/character/{id}?includeCustomItems=true
```

The response uses the character-service envelope described in
[Response envelopes](response-envelopes.md). `DdbClient` unwraps that envelope,
so the rest of the application receives the character object directly.

## Root structure

This is the subset currently consumed by the MCP. The live response contains
additional fields that have not yet been documented or typed.

```ts
interface DdbCharacter {
  id: number;
  readonlyUrl: string;
  name: string;

  race: DdbRace;
  classes: DdbClass[];
  background: DdbBackground;

  stats: DdbAbilityScore[];
  bonusStats: DdbAbilityScore[];
  overrideStats: DdbAbilityScore[];
  modifiers: Record<string, DdbModifier[]>;

  baseHitPoints: number;
  bonusHitPoints: number | null;
  overrideHitPoints: number | null;
  removedHitPoints: number;
  temporaryHitPoints: number;

  spells: DdbSpellsContainer;
  classSpells?: DdbClassSpellCollection[];
  spellSlots?: DdbSpellSlot[];
  pactMagic?: DdbPactMagicPayload | null;

  inventory: DdbInventoryItem[];
  currencies: DdbCurrencies;
  characterValues?: DdbCharacterValue[];

  actions: Record<string, DdbAction[]>;
  options?: Record<string, DdbCharacterOption[] | null>;
  customProficiencies?: DdbCustomProficiency[];
  feats: DdbFeat[];

  deathSaves: DdbDeathSaves;
  traits: DdbTraits;
  notes: DdbNotes;
  campaign: { id: number; name: string } | null;
}
```

See [Spells and slots](spells-and-slots.md) and
[Inventory and customization](inventory-and-customization.md) for the nested
structures with known payload variants.

## Ability scores

```ts
interface DdbAbilityScore {
  id: 1 | 2 | 3 | 4 | 5 | 6;
  value: number | null;
}
```

| ID | Ability |
|---:|---|
| 1 | Strength |
| 2 | Dexterity |
| 3 | Constitution |
| 4 | Intelligence |
| 5 | Wisdom |
| 6 | Charisma |

The normalized score precedence is:

1. Use a non-null entry in `overrideStats`.
2. Otherwise add the matching `stats` and `bonusStats` values.
3. Apply matching `bonus` modifiers such as `strength-score`.
4. Apply a matching `set` modifier only when it improves the result.

Items such as Gauntlets of Ogre Power use a `set` modifier rather than changing
the base `stats` entry.

## Character level and proficiency bonus

Do not rely on the optional root `level` field. The normalized character level
is the sum of `classes[].level`:

```ts
const level = character.classes.reduce((sum, cls) => sum + cls.level, 0);
const proficiencyBonus = Math.ceil(level / 4) + 1;
```

## Hit points

**Observed and verified:** character-service v5 returns `baseHitPoints` before
the Constitution modifier is applied. Unless `overrideHitPoints` is present, the
current normalizer calculates:

```text
maximum HP =
  baseHitPoints
  + bonusHitPoints
  + (Constitution modifier × total character level)
  + flat hit-points modifiers
  + (hit-points-per-level modifiers × total character level)

current HP = maximum HP - removedHitPoints
```

`temporaryHitPoints` is displayed separately and does not increase maximum HP.

## Classes and features

```ts
interface DdbClass {
  id: number; // character-specific class mapping ID
  definition: {
    id: number; // class definition ID
    name: string;
  };
  subclassDefinition: {
    name: string;
    classFeatures: DdbClassFeature[];
  } | null;
  level: number;
  isStartingClass: boolean;
  classFeatures: DdbClassFeature[];
  hitDiceUsed?: number;
}
```

**Observed payload inconsistency:** base-class features usually place fields
under `feature.definition`, while subclass features can expose the same fields
directly on the feature:

```ts
type DdbClassFeature =
  | {
      definition: {
        name: string;
        requiredLevel: number;
        description: string;
        snippet: string | null;
      };
    }
  | {
      name: string;
      requiredLevel: number;
      description: string;
    };
```

The MCP normalizes access to the feature name, required level, and description,
then excludes features above the character's class level.

Selected choices such as Warlock invocations and Pact Boons are not represented
only by the generic class feature list. They are found in `options.class`; see
[Inventory and customization](inventory-and-customization.md#selected-class-options).

## Modifiers

Modifiers are grouped by source category rather than returned as one array:

```ts
interface DdbModifier {
  id: string | number;
  type: string;
  subType: string;
  value: number | null;
  friendlyTypeName: string;
  friendlySubtypeName: string;
  componentId: number;
  componentTypeId: number;
}

type ModifierGroups = Record<string, DdbModifier[]>;
```

Common group keys include `race`, `class`, `background`, `item`, `feat`, and
`condition`. Code must iterate all array-valued groups rather than hard-coding
only those names.

Currently used modifier patterns include:

| `type` | Example `subType` | Meaning in the current normalizer |
|---|---|---|
| `bonus` | `initiative`, `spell-save-dc`, `hit-points` | Add the numeric value |
| `set` | `strength-score`, `unarmored-armor-class` | Establish a candidate/base value |
| `set-base` | `darkvision` | Establish a base sense distance |
| `proficiency` | `insight`, `light-armor` | Grant proficiency |
| `expertise` | `perception` | Grant double proficiency |
| `language` | `celestial` | Grant a language |
| `ignore` | `unarmored-dex-ac-bonus` | Disable a calculation component |

Modifier stacking semantics are only partially catalogued. Unknown modifier
types or subtypes should be preserved for diagnostics rather than silently
discarded at the API boundary.

## Derived values

The API does not provide every displayed character-sheet value as one reliable
root property. The MCP currently derives:

- total level and proficiency bonus;
- final ability scores and modifiers;
- maximum and current HP;
- armor class from armor, shields, ability modifiers, class rules, and modifiers;
- saving throws and skills;
- initiative from Dexterity plus `initiative` bonuses;
- passive Perception, Insight, and Investigation from normalized skill totals;
- senses from `set`, `set-base`, and `bonus` modifiers;
- spell save DC and spell attack bonus from class ability, proficiency, and
  applicable modifiers.

These calculations should remain in shared normalizers so summary, sheet, full,
and resource outputs cannot drift apart.

## Validation history

The current structures and calculations have been compared with two different
live character types:

- a 2024 Sorcerer, which exposed HP, natural armor, spell-save modifier, and
  incomplete `spells.*` assumptions;
- a legacy 2014 Hexblade Warlock, which exposed level-indexed Pact Magic,
  invocation/item/racial spells, selected options, languages, custom skills,
  senses, attunement, and custom item names.

The regression fixtures intentionally contain no authentication material or
complete private character payloads.

