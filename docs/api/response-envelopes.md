# Response envelopes and transport behavior

## Service domains

| Service | Base URL | Authentication used by this project | Response handling |
|---|---|---|---|
| Character service | `https://character-service.dndbeyond.com` | Bearer token | Unwrap `data` from a character-service envelope |
| Monster service | `https://monster-service.dndbeyond.com` | Bearer token | Preserve the service-specific raw response |
| Main site / Waterdeep | `https://www.dndbeyond.com` | Cookies and bearer token | Unwrap `data` when `status` is `success` |

Authentication values are local secrets and must never appear in fixtures or
documentation.

## Character-service envelope

**Observed** on character-service v5 reads and writes:

```ts
interface CharacterServiceEnvelope<T> {
  id: number;
  success: boolean;
  message: string;
  data: T;
  pagination?: unknown | null;
}
```

Representative response:

```json
{
  "id": 0,
  "success": true,
  "message": "",
  "data": {},
  "pagination": null
}
```

If `success` is false, the client treats the response as an error even when the
HTTP request itself succeeded.

## Waterdeep envelope

**Observed** on campaign endpoints:

```ts
interface WaterdeepEnvelope<T> {
  status: "success" | string;
  data: T;
}
```

The client unwraps `data` only when `status === "success"`.

## Monster-service responses

Monster-service responses do not follow the character-service envelope. Search
responses contain service metadata alongside `data`:

```ts
interface MonsterSearchResponse<T> {
  accessType: Record<string, number>;
  pagination: {
    take: number;
    skip: number;
    currentPage: number;
    pages: number;
    total: number;
  };
  stats: unknown;
  metaData: unknown;
  data: T[];
}
```

For that reason, monster calls use `DdbClient.getRaw()` rather than
`DdbClient.get()`.

## Client contract

`DdbClient.get()`, `post()`, `put()`, and `delete()` return the unwrapped value
from `data` when a recognized envelope is present. Callers should type the
payload itself, not the outer envelope:

```ts
const character = await client.get<DdbCharacter>(url, cacheKey);
// `character` is DdbCharacter, not CharacterServiceEnvelope<DdbCharacter>.
```

`DdbClient.getRaw()` returns the JSON exactly as delivered by the service.

## Nullability and missing fields

Observed payloads mix all of the following:

- an absent property;
- a property with `null`;
- an empty array;
- a level-indexed array containing zero-valued placeholder rows.

These states are not interchangeable. Normalizers should distinguish “not
returned” from “returned but empty,” and tests should cover both when behavior
depends on the distinction.

## Current endpoint families

The endpoint constructors live in `src/api/endpoints.ts`.

| Family | Representative path |
|---|---|
| Character read | `GET /character/v5/character/{id}?includeCustomItems=true` |
| Owned characters | `GET /character/v5/characters/list?userId={userId}` |
| Character writes | `/character/v5/life/*`, `/spell/*`, `/inventory/*`, `/description/*` |
| Game data | `GET /character/v5/game-data/*?sharingSetting=2` |
| Campaigns | `GET /api/campaign/stt/*` |
| Monsters | `GET /v1/Monster` and `GET /v1/Monster/{id}` |

These are unofficial endpoints and can change without versioned notice.

