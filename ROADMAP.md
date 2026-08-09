# Roadmap

This roadmap tracks the next improvements planned for `dndbeyond-mcp`. Because
D&D Beyond's character and game-data APIs are unofficial, correctness and
regression coverage take priority over adding more write operations.

## Guiding principles

- Normalize each raw API concept once and reuse it across tools and resources.
- Validate derived character data against the live sheet or a recent PDF.
- Preserve definition identity, source provenance, rules version, and casting
  method instead of merging records by display name alone.
- Keep live validation read-only by default.
- Add a sanitized regression fixture for every newly supported payload variant.

## Near term

### Release hygiene

Target: next patch release

- [ ] Read the MCP server version from `package.json` instead of hard-coding it.
- [ ] Add CI for supported Node.js versions.
- [ ] Run tests, TypeScript compilation, and `npm pack --dry-run` in CI.
- [ ] Smoke-test an MCP initialization using the packed npm artifact.
- [ ] Reconcile the README tool list with the tools registered by the server.
- [ ] Add a changelog and release checklist.

### Canonical character model

Target: next minor release

- [ ] Introduce a single `NormalizedCharacter` boundary between raw API data
      and MCP output.
- [ ] Normalize identity, level, proficiency bonus, abilities, defenses,
      movement, senses, proficiencies, spells, inventory, features, and
      limited-use resources.
- [ ] Record derivation inputs and warnings for calculated values.
- [ ] Make summary, sheet, full, and resource output consume the same normalized
      values.
- [ ] Add parity tests proving shared values agree across every output path.

## Next

### Mechanical completeness

- [ ] Respect modifier restrictions, equipment state, armor state, attunement,
      and active/inactive grants.
- [ ] Normalize resistances, immunities, vulnerabilities, and condition
      immunities.
- [ ] Normalize advantage and disadvantage for saves, checks, and initiative.
- [ ] Support half proficiency, expertise, and flat bonuses consistently.
- [ ] Add weapon attack summaries including attack bonus, damage, range,
      properties, and mastery selections.
- [ ] Make movement bonuses and flying restrictions armor-aware.
- [ ] Support additional limited-use operators as verified payload examples are
      captured.

### Spellcasting and safe writes

- [ ] Model each spell's cast method explicitly: spell slot, Pact Magic, at
      will, limited use, item charge, ritual, or unknown.
- [ ] Calculate spell save DC and attack bonus per casting source.
- [ ] Preserve legacy and current definitions when their names match.
- [ ] Make `cast_spell` reject ambiguous resource consumption rather than
      decrementing a guessed slot.
- [ ] Add dry-run previews for composite character write operations.

### Validation and API-drift detection

- [ ] Maintain sanitized fixtures for representative current, legacy, hybrid,
      multiclass, prepared-caster, and Pact Magic characters.
- [ ] Add runtime warnings for unknown payload and modifier patterns.
- [ ] Add a read-only diagnostic output that explains derived values such as AC,
      HP, saves, and spell DC.
- [ ] Separate read-only live smoke tests from explicitly enabled destructive
      lifecycle tests.

## Later

### Architecture and performance

- [ ] Split the character tool module into normalization, formatting, reads,
      and writes.
- [ ] Split reference tools by entity type.
- [ ] Remove duplicated formatting between tools and resources.
- [ ] Avoid unnecessary N+1 character requests when list payloads are sufficient.
- [ ] Add in-flight request deduplication and standardized API errors.

### Stable release

- [ ] Define and document the supported normalized-output contract.
- [ ] Test Codex, Claude Code, and Claude Desktop with the packed npm artifact.
- [ ] Document known unsupported calculations and unofficial-API limitations.
- [ ] Publish a release candidate before declaring the project stable.

## Issue workflow

When GitHub Issues are enabled, create implementation issues only for the active
roadmap section. Each issue should include:

- the raw payload shape or endpoint being supported;
- the expected normalized result;
- affected tools and resources;
- sanitized fixture requirements;
- acceptance tests and documentation updates.

Completed work should be checked off here when its release is published.
