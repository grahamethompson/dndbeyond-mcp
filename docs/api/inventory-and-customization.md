# Inventory and character customization

## Inventory records

The character root contains an `inventory` array:

```ts
interface DdbInventoryItem {
  id: number; // character inventory record ID
  definition: {
    name: string;
    description: string; // HTML
    type: string;
    rarity: string;
    weight: number;
    cost: number | null;
    isHomebrew: boolean;
    armorClass?: number | null;
    filterType?: string;
    armorTypeId?: number | null;
    baseArmorName?: string | null;
  };
  equipped: boolean;
  isAttuned?: boolean;
  quantity: number;
}
```

`id` identifies this copy of the item on the character. It is not necessarily
the same as an item definition ID from the game-data collection.

`equipped` and `isAttuned` are independent. Preserve both values; do not infer
attunement from equipment state or vice versa.

## Custom item display names

Custom names are not stored on `inventory[].definition.name`. They are linked
through the character-level `characterValues` array.

**Observed** custom-name record:

```ts
interface DdbCharacterValue {
  typeId: number;
  value: string | number | null;
  valueId: string | number;
  valueTypeId?: string | number;
}
```

For custom inventory names:

- `typeId === 8` identifies the custom-name value;
- `String(characterValue.valueId) === String(inventoryItem.id)` links the value
  to an inventory record;
- a non-empty string in `value` is the character's display name;
- `inventoryItem.definition.name` remains the underlying D&D Beyond item name.

Representative sanitized example:

```json
{
  "inventory": [
    {
      "id": 98765,
      "definition": { "name": "Ioun Stone of Reserve" },
      "equipped": true,
      "isAttuned": true,
      "quantity": 1
    }
  ],
  "characterValues": [
    {
      "typeId": 8,
      "valueId": "98765",
      "value": "Ioun stone"
    }
  ]
}
```

Normalized output should retain both names:

```ts
interface NormalizedInventoryItem {
  instanceId: string;
  displayName: string;
  definitionName: string;
  quantity: number;
  equipped: boolean;
  attuned: boolean;
}
```

## Currency

```ts
interface DdbCurrencies {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}
```

The write endpoints use full coin names in the URL but retain abbreviated coin
keys in the character payload:

| Payload key | Write path suffix |
|---|---|
| `cp` | `copper` |
| `sp` | `silver` |
| `ep` | `electrum` |
| `gp` | `gold` |
| `pp` | `platinum` |

## Selected class options

Generic class feature records describe containers such as “Eldritch
Invocations” or “Pact Boon.” The character's actual selections are returned in
`options.class`:

```ts
interface DdbCharacterOption {
  componentId?: number;
  componentTypeId?: number;
  definition: {
    id?: number;
    name: string;
    description?: string | null;
    snippet?: string | null;
  };
}

interface DdbCharacterOptions {
  class?: DdbCharacterOption[] | null;
  [source: string]: DdbCharacterOption[] | null | undefined;
}
```

**Verified:** a legacy Warlock's invocation names and Pact of the Blade were
present in `options.class` but could not be reconstructed from the generic class
feature names alone.

## Languages

Languages can come from more than one structure.

### Modifier-granted languages

Observed records use `type: "language"` with a language name in
`friendlySubtypeName` and a slug in `subType`:

```json
{
  "type": "language",
  "subType": "celestial",
  "value": null,
  "friendlySubtypeName": "Celestial"
}
```

Do not require `type: "proficiency"` when collecting languages.

### Custom languages

Custom languages appear in `customProficiencies` with `type === 3`:

```json
{
  "name": "Custom Language 1",
  "type": 3,
  "statId": null,
  "proficiencyLevel": 3
}
```

The display name is the user-entered `name` value.

## Custom skill proficiencies

Custom skills appear in the same array with `type === 1` and an ability ID in
`statId`:

```ts
interface DdbCustomProficiency {
  id?: number;
  name: string;
  type: number;
  statId?: number | null;
  proficiencyLevel?: number;
}
```

**Observed and verified:** `proficiencyLevel === 3` represented normal
proficiency in a custom Intelligence skill. The current normalizer uses this
enum interpretation:

| Value | Interpretation | Confidence |
|---:|---|---|
| 1 | None | Inferred |
| 2 | Half proficiency | Inferred |
| 3 | Proficient | Verified in one live character |
| 4 | Expertise | Inferred |

Additional live examples should be captured as sanitized regression fixtures
before treating the entire enum as verified.

