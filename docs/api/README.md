# D&D Beyond API data structures

This directory documents the reverse-engineered D&D Beyond payloads consumed by
this project. D&D Beyond does not publish these endpoints as a supported public
API, so every structure here should be treated as an observed contract rather
than a permanent specification.

Last live validation: **2026-08-09**.

## Documents

| Document | Scope |
|---|---|
| [Response envelopes](response-envelopes.md) | Service domains, authentication, envelopes, and client unwrapping |
| [Character service v5](character-v5.md) | Character root object, abilities, HP, classes, modifiers, options, and derived values |
| [Spells and slots](spells-and-slots.md) | Spell collections, source attribution, rules versions, regular slots, and Pact Magic |
| [Inventory and customization](inventory-and-customization.md) | Inventory records, custom names, attunement, languages, and custom proficiencies |
| [Normalization contract](normalization-contract.md) | Rules for translating unstable API payloads into consistent MCP data |

The older [API research notes](../api-research.md) remain useful for endpoint
discovery, compendium services, monsters, and historical findings. The files in
this directory are the maintained reference for data structures used by the
current implementation.

## Evidence labels

The documentation uses these labels when certainty matters:

- **Observed** — present in a live response or captured browser request.
- **Verified** — compared with the D&D Beyond character sheet or a recent PDF.
- **Inferred** — meaning derived from behavior, rules, or cross-field comparison.
- **Compatibility** — an older payload shape still accepted by the MCP.

## Documentation rules

- Never commit cookies, bearer tokens, account IDs, or full private payloads.
- Use sanitized, minimal examples rather than complete character exports.
- Record the validation date when a payload assumption changes.
- Preserve numeric and definition identities. Names alone are not unique.
- Preserve legacy/current rules distinctions even when display names match.
- Document raw API shape separately from normalized MCP behavior.
- Add a regression test for every payload variant incorporated into production
  normalization.

## Source-of-truth order

When the docs and implementation disagree, check sources in this order:

1. A current live API response.
2. The current D&D Beyond sheet or recent exported PDF for displayed values.
3. Regression fixtures under `tests/`.
4. TypeScript declarations under `src/types/`.
5. These documents and historical research notes.

Update the types, normalizers, tests, and documentation together after resolving
the discrepancy.

## Planned coverage

- Campaign and character-list payloads
- Character actions, limited-use resources, and rests
- Builder choices and character creation writes
- Game-data collections for spells, items, feats, classes, races, and backgrounds
- Monster-service search and detail payloads
- Modifier subtype catalog and stacking behavior

