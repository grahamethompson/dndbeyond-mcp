# dndbeyond-mcp

A TypeScript MCP (Model Context Protocol) server for D&D Beyond. Gives Claude (and other MCP-compatible AI assistants) access to your D&D Beyond characters, campaigns, spells, monsters, items, and more.

> **Disclaimer:** This project uses unofficial, reverse-engineered D&D Beyond endpoints. It is not affiliated with, endorsed by, or supported by D&D Beyond or Wizards of the Coast. Endpoints may change without notice.

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

### 1. Clone, install, and build

```bash
git clone git@github.com:grahamethompson/dndbeyond-mcp.git
cd dndbeyond-mcp
npm ci
npm run build
```

### 2. Authenticate with D&D Beyond

```bash
npm run setup
```

A Chrome window opens at D&D Beyond. Log in normally and wait for the terminal
to report that authentication succeeded. Credentials are stored locally in
`~/.dndbeyond-mcp/config.json`.

> Never commit or share `~/.dndbeyond-mcp/config.json`. Its session cookies can
> access your D&D Beyond account.

### 3. Connect Codex

Add the server to `~/.codex/config.toml`, replacing the path with the absolute
path to your clone:

```toml
[mcp_servers.dndbeyond]
command = "node"
args = ["/absolute/path/to/dndbeyond-mcp/build/src/index.js"]
```

Restart Codex after saving the configuration. To verify the connection without
changing live character data, ask Codex:

```text
Use the D&D Beyond MCP to check authentication and list my characters.
Do not modify any character data.
```

### 4. Rebuild after pulling or editing

```bash
npm ci
npm run build
npm test
```

Restart or reconnect the MCP server so its Node.js process loads the new build.

## Other installation options

### Run the npm package

An MCP client can launch the published package with `npx`. Authenticate after
connecting by invoking the `setup_auth` MCP tool.

```toml
[mcp_servers.dndbeyond]
command = "npx"
args = ["-y", "dndbeyond-mcp"]
```

### Claude Desktop

Add the locally built server to the Claude Desktop configuration, replacing the
path with the absolute path to your clone.

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "dndbeyond": {
      "command": "node",
      "args": ["/absolute/path/to/dndbeyond-mcp/build/src/index.js"]
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
