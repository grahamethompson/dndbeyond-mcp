# dndbeyond-mcp

A TypeScript MCP (Model Context Protocol) server for D&D Beyond. Gives Claude (and other MCP-compatible AI assistants) access to your D&D Beyond characters, campaigns, spells, monsters, items, and more.

> **Disclaimer:** This project uses unofficial, reverse-engineered D&D Beyond endpoints. It is not affiliated with, endorsed by, or supported by D&D Beyond or Wizards of the Coast. Endpoints may change without notice.

## Credit

This project is a fork of [AlexWorland/dndbeyond-mcp](https://github.com/AlexWorland/dndbeyond-mcp), originally created by [Alex Worland](https://github.com/AlexWorland). Thanks to Alex for creating and sharing the original project.

## Features

- **Character Management** — Read character sheets, update HP, spell slots, death saves, currency
- **Campaign Access** — List campaigns, view party rosters
- **Reference Lookups** — Search and retrieve spells, monsters, magic items, feats, conditions, classes
- **Workflow Prompts** — Session prep, encounter building, level-up guidance, spell recommendations
- **Browser-Based Auth** — Playwright-powered login flow (no manual cookie extraction)

## Quick start

### Requirements

- Node.js 20 or newer
- npm
- Google Chrome, used for the interactive D&D Beyond login
- A D&D Beyond account

### 1. Connect Codex with `npx`

Add the published package to `~/.codex/config.toml`:

```toml
[mcp_servers.dndbeyond]
command = "npx"
args = ["-y", "@grahamethompson/dndbeyond-mcp"]
```

`npx` downloads and runs the latest published version automatically, so you do
not need to clone or build the repository. Restart Codex after saving the
configuration.

### 2. Authenticate with D&D Beyond

Ask Codex:

```text
Use the D&D Beyond MCP setup_auth tool to authenticate my account.
```

A Chrome window opens at D&D Beyond. Log in normally and wait for the MCP tool
to report that authentication succeeded. Credentials are stored locally in
`~/.dndbeyond-mcp/config.json`.

> Never commit or share `~/.dndbeyond-mcp/config.json`. Its session cookies can
> access your D&D Beyond account.

### 3. Verify the connection

To verify the connection without changing live character data, ask Codex:

```text
Use the D&D Beyond MCP to check authentication and list my characters.
Do not modify any character data.
```

## Other installation options

### Install from source

Clone and build the repository if you want to develop or inspect the server
locally:

```bash
git clone git@github.com:grahamethompson/dndbeyond-mcp.git
cd dndbeyond-mcp
npm ci
npm run build
npm run setup
```

Then point Codex at the local build, replacing the path with the absolute path
to your clone:

```toml
[mcp_servers.dndbeyond]
command = "node"
args = ["/absolute/path/to/dndbeyond-mcp/build/src/index.js"]
```

After pulling or editing the source, run `npm ci`, `npm run build`, and
`npm test`, then restart or reconnect the MCP server.

### Claude Desktop

Add the published package to the Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dndbeyond": {
      "command": "npx",
      "args": ["-y", "@grahamethompson/dndbeyond-mcp"]
    }
  }
}
```

Restart Claude Desktop after saving the configuration.

## Tools

### Character

- `get_character` — Full character sheet by ID or name
- `list_characters` — All your characters
- `update_hp` — Apply damage or healing
- `update_spell_slots` — Use or restore spell slots
- `update_death_saves` — Record death saves
- `update_currency` — Modify gold/silver/copper
- `use_ability` — Decrement limited-use features

### Campaign

- `list_campaigns` — Your active campaigns
- `get_campaign_characters` — All characters in a campaign

### Reference

- `search_spells` / `get_spell` — Spell lookup with filters
- `search_monsters` / `get_monster` — Monster stat blocks
- `search_items` / `get_item` — Magic item catalog
- `search_feats` — Feat discovery
- `get_condition` — Condition rules
- `search_classes` — Class/subclass info

### Utility

- `setup_auth` — Re-run login flow
- `check_auth` — Verify session is valid

## Resources

| URI | Description |
|-----|-------------|
| `dndbeyond://characters` | Your character list |
| `dndbeyond://character/{id}` | Character sheet |
| `dndbeyond://character/{id}/spells` | Spell list |
| `dndbeyond://character/{id}/inventory` | Inventory |
| `dndbeyond://campaigns` | Your campaigns |
| `dndbeyond://campaign/{id}/party` | Party roster |

## Prompts

| Prompt | Purpose |
|--------|---------|
| `character-summary` | Full character rundown |
| `session-prep` | DM session preparation |
| `encounter-builder` | Balanced encounter design |
| `spell-advisor` | Spell recommendations |
| `level-up-guide` | Level-up walkthrough |
| `rules-lookup` | Rules clarification |

## Security

This server stores your D&D Beyond session cookie locally at `~/.dndbeyond-mcp/config.json`. The cookie provides full access to your D&D Beyond account. Never share this file. The server only communicates with `dndbeyond.com` domains.

## License

MIT
