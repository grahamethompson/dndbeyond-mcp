# D&D Beyond MCP — Agent Instructions

This file provides repository guidance for Codex and other coding agents. It mirrors the operational information in `CLAUDE.md` and adds reference links and known D&D Beyond integration pitfalls. Keep both instruction files aligned when commands or architecture change.

## Build and test commands

```bash
npm run build          # TypeScript compilation (tsc)
npm run dev            # Watch mode (tsc --watch)
npm test               # Run all tests (Vitest)
npm run test:watch     # Vitest watch mode
npx vitest tests/tools/character.test.ts  # Run one test file
npx vitest -t "should format"             # Run tests matching a name
npm run setup          # Browser-based authentication flow (Playwright)
```

After rebuilding, restart the MCP client or desktop application before testing through MCP. The stdio server process keeps the previously loaded compiled JavaScript in memory.

## Architecture

This is an ES module TypeScript project targeting ES2022/Node16. It exposes D&D Beyond data through MCP tools, resources, and prompts.

### Request flow

```text
MCP Client → StdioServerTransport → McpServer (src/server.ts)
  → Tool handler (src/tools/*.ts)
    → DdbClient (src/api/client.ts)
      → TtlCache → RateLimiter (2 requests/second) → CircuitBreaker
        → withRetry → fetch → D&D Beyond API
```

### API hosts

| Host | Authentication | Response envelope | Client method |
|---|---|---|---|
| `character-service.dndbeyond.com` | Bearer token | `{ success, data }` | `client.get()` |
| `monster-service.dndbeyond.com` | Bearer token | `{ accessType, pagination, data }` | `client.getRaw()` |
| `www.dndbeyond.com` | Cookie and bearer token | `{ status: "success", data }` | `client.get()` |

`client.get()` unwraps supported envelopes automatically. `client.getRaw()` preserves the original JSON and is used for the monster service's different response format.

## Important repository locations

- `src/server.ts` — MCP server and tool/resource registration
- `src/api/client.ts` — HTTP client, headers, response-envelope handling, and cache integration
- `src/api/endpoints.ts` — D&D Beyond endpoint URL builders
- `src/api/` — authentication, cobalt-token exchange, and API access
- `src/tools/character.ts` — character read and write tools
- `src/tools/campaign.ts` — campaign tools
- `src/tools/reference.ts` — spell, item, monster, class, feat, and other reference tools
- `src/tools/auth.ts` — authentication tools
- `src/resources/character.ts` — character, spell, and inventory MCP resources
- `src/resources/` — all MCP resource templates
- `src/types/character.ts` — character-service response model
- `src/types/` — API and tool parameter types
- `src/utils/character-calculations.ts` — derived scores such as HP and AC
- `src/resilience/` — circuit breaker, rate limiter, and exponential retry
- `src/cache/` — TTL cache with LRU eviction
- `src/prompts/` — workflow prompts such as session preparation and encounter building
- `setup/` — Playwright browser authentication flow
- `tests/` — Vitest coverage for tools, resources, API behavior, and calculations
- `README.md` — user-facing installation, configuration, and MCP capability documentation
- `CLAUDE.md` — parallel repository instructions that should remain consistent with this file

## Authentication and secrets

- Credentials are stored outside the repository at `~/.dndbeyond-mcp/config.json`.
- Never print, copy into fixtures, or commit the CobaltSession cookie, cobalt token, or complete request headers.
- A cobalt token is obtained by posting cookies to `auth-service.dndbeyond.com/v1/cobalt-token` and cached in memory with a 30-second buffer before expiry.
- `DdbClient.buildHeaders()` chooses bearer-only or cookie-plus-bearer authentication based on the destination host.

## Testing patterns

- Vitest 3 is configured with globals enabled.
- Mock `getCobaltToken` and `getAllCookies`; do not mock `getCobaltSession`.
- Mock clients should supply `{ get, getRaw }`.
- `get()` mocks return already-unwrapped data, not the API response envelope.
- Fetch mocks use `global.fetch = vi.fn()` with an object such as `{ ok: true, json: () => Promise.resolve(data) }`.
- Timer-dependent retry tests use `vi.useFakeTimers()` and `vi.runAllTimersAsync()`.
- Character fixtures must include `modifiers` and `actions`.
- Add regression tests whenever a formatter or derived calculation is corrected. Prefer a fixture representing the real API shape that exposed the problem.

## Code conventions

- Tool handlers return `{ content: [{ type: "text", text: string }] }`.
- Define endpoint URLs as builder functions in `src/api/endpoints.ts`.
- Cache keys use the `entity:id` pattern, such as `character:123` or `spell-compendium:class:1`.
- Character lookup supports fuzzy case-insensitive names as well as numeric IDs.
- Ability IDs are 1–6: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.
- `client.put()` invalidates specified cache keys after a successful write.
- The spell compendium queries `always-known-spells` across the eight casting-class IDs without authentication.
- Preserve user changes and avoid write operations against live D&D Beyond characters unless explicitly requested.

## Character-data correctness

D&D Beyond's character payload is not normalized. Do not assume one property contains every instance of a concept.

- Selected class spells can be stored under top-level `classSpells`, while racial, feat, item, background, and other granted spells appear under `spells.*`. Spell resources and character summaries must merge both sources and deduplicate the result.
- A `full` character response should expand definitions for selected class spells as well as granted spells.
- Preserve a spell's real activation type. In particular, non-core or setting spells such as *Silvery Barbs* may be absent from the locally assembled compendium even though they are present on a character payload. *Silvery Barbs* is a Reaction, not an Action.
- Derived HP must include all character-service values and relevant modifiers. Validate level-one handling, Constitution contributions, bonuses, overrides, removed HP, and temporary HP separately.
- AC calculation must account for natural armor, unarmored defense, equipped armor, shields, set modifiers, bonuses, and conditional effects. Do not default every unarmored character to `10 + Dexterity`.
- Conditional features must remain conditional. For example, a 2024 Sorcerer's Innate Sorcery increases spell save DC only while the feature is active.
- D&D Beyond may expose optional-class-feature placeholders through data commonly treated as feats. Do not present an unselected generic `Dark Bargain` entry as a real character feat or mechanical benefit.
- Compare formatter changes against a recent D&D Beyond PDF export or the visible live sheet. A successful API response proves connectivity, not correctness.

## Reporting bugs and feature requests

- Direct users to [GitHub Issues](https://github.com/grahamethompson/dndbeyond-mcp/issues)
  to report bugs or request features. They can also contact
  [@grahamethompson](https://github.com/grahamethompson).
- Do not create an external issue unless the user explicitly asks for one.
- When filing an issue, check for duplicates and include reproduction steps,
  expected behavior, actual behavior, and a sanitized payload example when it
  materially helps diagnosis.
- Never include authentication data, complete private character payloads, or
  other users' campaign information in an issue.

## Important external references

- [D&D Beyond Free Rules (2024)](https://www.dndbeyond.com/sources/dnd/free-rules) — current core rules wording and terminology
- [The Crooked Moon: release issues and support](https://www.dndbeyond.com/forums/d-d-beyond-general/release-issues-support/225155-the-crooked-moon-part-one-player-options-campaign) — implementation details for Dark Bargains, optional class features, and known character-builder limitations
- [Model Context Protocol TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — MCP server, transport, tool, and resource APIs

The D&D Beyond character-service APIs used here are unofficial and undocumented. When behavior changes, capture the real response shape safely, update the local types and fixtures, and document the discovery without recording credentials or private character data.
