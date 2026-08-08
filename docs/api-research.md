# D&D Beyond API - Reverse Engineered Endpoints

## Current Verified Contract (2026-08-08)

The current contract below was verified against D&D Beyond's production APIs and
the source map for the official character app. D&D Beyond does not publish this
as a supported public API, so future character-app releases can change it again.

### Character reads

| Operation | Method and path | Notes |
|---|---|---|
| Owned characters | `GET /character/v5/characters/list?userId={userId}` | Returns `{ characterSlotLimit, canUnlockCharacters, characters }`; this is not a campaign party roster. |
| Character sheet | `GET /character/v5/character/{id}?includeCustomItems=true` | Prepared class spells are primarily in `classSpells[].spells`, not only `spells.class`. |

### Character gameplay writes

All character gameplay endpoints below take `characterId` in the JSON body. The
character ID is not part of these paths.

| Operation | Method and path | Important body fields |
|---|---|---|
| HP | `PUT /character/v5/life/hp/damage-taken` | `characterId`, `removedHitPoints`, optional `temporaryHitPoints` |
| Death saves | `PUT /character/v5/life/death-saves` | `characterId`, `failCount`, `successCount` |
| Spell slots | `PUT /character/v5/spell/slots` | `characterId`, `level1` … `level9` |
| Pact magic | `PUT /character/v5/spell/pact-magic` | `characterId`, the pact slot's `levelN` field |
| Currency | `PUT /character/v5/inventory/currency/{copper|silver|electrum|gold|platinum}` | `characterId`, `amount` |
| Inspiration | `PUT /character/v5/character/inspiration` | `characterId`, `inspiration` |
| Conditions | `PUT`/`DELETE /character/v5/condition` | `characterId`, condition `id`; add also sends `level` and `totalHp` |
| Limited use | `PUT /character/v5/action/limited-use` | `characterId`, action `id`, `entityTypeId`, `uses` |
| Short rest | `POST /character/v5/character/rest/short` | `characterId`, `classHitDiceUsed`, `resetMaxHpModifier: false` |
| Long rest | `POST /character/v5/character/rest/long` | `characterId`, `resetMaxHpModifier: true`, `adjustConditionLevel: false` |

### Compendium data

Game-data collection calls use `sharingSetting=2` and accept an optional
`campaignId`. Campaign scope is essential when content sharing grants access.
Class features are embedded in `game-data/classes`; racial traits are embedded in
`game-data/races`. The former `game-data/class-feature/collection` assumption is
not valid, and `racial-trait/collection` is not a flat array.

The API contains both 2014 and 2024 definitions with duplicate names. Consumers
must key by definition identity and deliberately prefer current rules when a
single result is requested. Monster results with `accessType: 4` are restricted
stubs and must not be rendered as AC 0 / HP 0 stat blocks.

### Current condition IDs

`1` Blinded, `2` Charmed, `3` Deafened, `4` Exhaustion, `5` Frightened,
`6` Grappled, `7` Incapacitated, `8` Invisible, `9` Paralyzed, `10` Petrified,
`11` Poisoned, `12` Prone, `13` Restrained, `14` Stunned, `15` Unconscious.

---

## Service Domains

| Service | Base URL | Auth Required |
|---------|----------|---------------|
| Character Service | `https://character-service.dndbeyond.com/character/v5` | Bearer token (most endpoints) |
| Monster Service | `https://monster-service.dndbeyond.com/v1` | Optional (enhances access) |
| Auth Service | `https://auth-service.dndbeyond.com/v1` | CobaltSession cookie |
| Waterdeep (main site) | `https://www.dndbeyond.com/api` | Varies |

## Authentication

1. **CobaltSession cookie** → exchange via `POST /v1/cobalt-token` on auth-service → short-lived JWT
2. **Bearer token** in `Authorization: Bearer {jwt}` header
3. Some endpoints work without auth but return limited data (accessType: 4 = restricted)

---

## Monster Endpoints (`monster-service.dndbeyond.com`)

### Search/List Monsters
```
GET /v1/Monster?search={query}&skip={skip}&take={take}&showHomebrew={f|t}&sources={sourceId}
```
- **Auth:** Optional (free monsters return full stats without auth)
- **Params:**
  - `search` — text search (name matching)
  - `skip` — pagination offset (default: 0)
  - `take` — page size (default: 10, max: 100)
  - `showHomebrew` — `t` or `f` (default: excludes homebrew)
  - `sources` — filter by source book ID (repeatable)
- **Response:**
  ```json
  {
    "accessType": { "<monsterId>": 1|4 },
    "pagination": { "take": 10, "skip": 0, "currentPage": 1, "pages": 549, "total": 5485 },
    "stats": { "elapsedMilliseconds": 22 },
    "metaData": {},
    "data": [<MonsterObject>, ...]
  }
  ```
- **accessType values:** 1 = free/owned (full stats), 4 = restricted (empty stats)
- **Note:** Only `search`, `skip`, `take`, `showHomebrew`, `sources` actually filter. Other params are silently ignored.

### Get Monster by ID
```
GET /v1/Monster/{id}
```
- **Auth:** Optional
- **Response:**
  ```json
  {
    "stats": null|{...},
    "accessType": 1|4,
    "data": <MonsterObject>
  }
  ```

### Get Monsters by IDs (batch)
```
GET /v1/Monster?ids={id1}&ids={id2}&ids={id3}
```
- **Auth:** Optional
- Max ~100 IDs per request

### Monster Object Shape
```typescript
{
  id: number;
  entityTypeId: number;
  name: string;
  alignmentId: number;        // → config.alignments
  sizeId: number;              // → config.sizes (2=Small, 3=Medium, etc.)
  typeId: number;              // → config.monsterTypes
  armorClass: number;
  armorClassDescription: string;
  averageHitPoints: number;
  hitPointDice: { diceCount, diceValue, diceMultiplier, fixedValue, diceString };
  passivePerception: number;
  challengeRatingId: number;   // → config.challengeRatings
  isHomebrew: boolean;
  isLegendary: boolean;
  isMythic: boolean;
  hasLair: boolean;
  isLegacy: boolean;
  isReleased: boolean;
  url: string;
  avatarUrl: string;
  largeAvatarUrl: string;
  basicAvatarUrl: string;
  sourceId: number;
  sourcePageNumber: number;

  // Ability scores (statId: 1=STR, 2=DEX, 3=CON, 4=INT, 5=WIS, 6=CHA)
  stats: [{ statId, name, value }];

  // Skills (skillId maps to config)
  skills: [{ skillId, value, additionalBonus }];

  // Senses (senseId: 1=Blindsight, 2=Darkvision, 3=Tremorsense, 4=Truesight)
  senses: [{ senseId, notes }];

  // Saving throws
  savingThrows: [{ statId, bonusModifier }];

  // Movement (movementId: 1=Walk, 2=Burrow, 3=Climb, 4=Fly, 5=Swim)
  movements: [{ movementId, speed, notes }];

  // Languages
  languages: [{ languageId, notes }];

  // Damage adjustments & condition immunities (ID arrays)
  damageAdjustments: number[];
  conditionImmunities: number[];

  // HTML descriptions (contain the actual stat block text)
  specialTraitsDescription: string;    // HTML
  actionsDescription: string;          // HTML
  reactionsDescription: string;        // HTML
  legendaryActionsDescription: string; // HTML
  mythicActionsDescription: string;    // HTML
  bonusActionsDescription: string;     // HTML
  characteristicsDescription: string;  // HTML
  lairDescription: string;             // HTML
  languageDescription: string;
  languageNote: string;

  // Metadata
  subTypes: number[];
  environments: number[];      // → config.environments
  tags: any[];
  sources: [{ sourceId, pageNumber, sourceType }];
  version: string;
  hideCr: boolean;
  swarm: null | object;
  homebrewStatus: number;
  initiativeBonus: number;
  collectionUserId: number;
  conditionImmunitiesHtml: string;
  sensesHtml: string;
  skillsHtml: string;
}
```

---

## Spell Endpoints (`character-service.dndbeyond.com`)

### Full Spell Compendium (NO AUTH REQUIRED)
```
GET /character/v5/game-data/always-known-spells?classId={id}&classLevel={level}&sharingSetting=2
```
- **Auth:** NOT required
- **Params:**
  - `classId` — class ID (see class map below)
  - `classLevel` — max 20 for all spells
  - `sharingSetting` — always `2`
  - `campaignId` — optional
  - `spellListIds[]` — optional, repeatable
  - `backgroundId` — optional
- **Class ID Map:**
  | Class | ID | Spell Count (lvl 20) |
  |-------|----|---------------------|
  | Bard | 1 | 226 |
  | Cleric | 2 | 200 |
  | Druid | 3 | 235 |
  | Paladin | 4 | 69 |
  | Ranger | 5 | 90 |
  | Sorcerer | 6 | 259 |
  | Warlock | 7 | 83 |
  | Wizard | 8 | 423 |
  | Barbarian | 9 | ? |
  | Fighter | 10 | ? |
  | Monk | 11 | ? |
  | Rogue | 12 | ? |
  | Artificer | 252717 | ? |
  | Blood Hunter | 357975 | ? |
- **Response:** Same envelope as character data: `{ id, success, message, data[], pagination }`
- **Spell object:** Same shape as character spell definitions (has `definition` with full spell text)

### Class Spells (AUTH REQUIRED)
```
GET /character/v5/game-data/spells?classId={id}&classLevel={level}&sharingSetting=2[&campaignId={id}]
```
- **Auth:** Bearer token required (401 without)

### Always Prepared Spells
```
GET /character/v5/game-data/always-prepared-spells?classId={id}&classLevel={level}&sharingSetting=2
```
- **Auth:** Optional (returns empty without auth for most classes)

---

## Item/Equipment Endpoints (`character-service.dndbeyond.com`)

### Items (AUTH REQUIRED)
```
GET /character/v5/game-data/items?sharingSetting=2[&campaignId={id}]
```
- **Auth:** Bearer token required (401 without)
- Returns magic items and equipment

### Feats (AUTH REQUIRED)
```
GET /character/v5/game-data/feats
```
- **Auth:** Bearer token required

### Classes (AUTH REQUIRED)
```
GET /character/v5/game-data/classes
```
- **Auth:** Bearer token required

### Races (AUTH REQUIRED)
```
GET /character/v5/game-data/races
```
- **Auth:** Bearer token required

### Backgrounds (AUTH REQUIRED)
```
GET /character/v5/game-data/backgrounds
```
- **Auth:** Bearer token required

---

## Config/Lookup Endpoints (`www.dndbeyond.com`)

### Game Configuration (NO AUTH)
```
GET /api/config/json
```
Contains all enum ID-to-name mappings needed to decode monster/spell data:
- `challengeRatings[]` — id, value, proficiencyBonus, xp
- `monsterTypes[]` — id, name (Aberration, Beast, Celestial, etc.)
- `monsterSubTypes[]` — 191 subtypes
- `environments[]` — 31 environments
- `alignments[]` — id, name
- `damageTypes[]` — 13 types
- `senses[]` — Blindsight, Darkvision, Tremorsense, Truesight
- `conditionTypes[]` — Standard, Special
- `armorTypes[]`, `gearTypes[]`, `weaponCategories[]`
- `languages[]`, `activationTypes[]`, `spellComponents[]`
- Game rule constants (max spell level, max stat score, etc.)

### Navigation Sources
```
GET /navigation/sources.json
```

---

## Verified Non-Existent Services

These domains do NOT exist (CORS/DNS failure):
- `spell-service.dndbeyond.com`
- `item-service.dndbeyond.com`
- `feat-service.dndbeyond.com`
- `class-service.dndbeyond.com`
- `content-service.dndbeyond.com`
- `compendium-service.dndbeyond.com`
- `game-data-service.dndbeyond.com` (CORS blocked)

These domains exist but return 404 on all tested paths:
- `gamedata-service.dndbeyond.com`
- `encounter-service.dndbeyond.com`

---

## Implementation Strategy

### Monsters — Ready to implement
- Use `monster-service.dndbeyond.com/v1/Monster` for search and detail
- Works without auth for SRD/free content
- With auth (Bearer token), provides full stat blocks for owned content
- Decode IDs using `/api/config/json` enums

### Spells — Ready to implement
- Use `always-known-spells` endpoint to build full compendium
- Query all casting classes at level 20, deduplicate by spell definition ID
- Works WITHOUT auth
- Same spell definition shape already used in character tool

### Items — Needs auth
- Use `game-data/items` with Bearer token
- Should work with existing cobalt token auth

### Feats — Needs auth
- Use `game-data/feats` with Bearer token

### Classes — Needs auth
- Use `game-data/classes` with Bearer token

### Conditions — Use config
- Condition names are in `/api/config/json` but rules text is likely in character data or embedded in the SSR pages
- May need to hardcode the 15 standard D&D conditions

## Sources
- [MrPrimate/ddb-proxy](https://github.com/MrPrimate/ddb-proxy) — community reverse-engineered proxy
- Browser network inspection of dndbeyond.com (Feb 2026)
