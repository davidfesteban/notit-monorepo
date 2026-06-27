# Notit MCP

Local STDIO MCP server for a checked-out Notit notes repo. No GitHub token is needed.

## Start

```sh
NOTIT_REPO_DIR=/absolute/path/to/your/notit-notes-repo \
npm run mcp:notit
```

If you run it from the notes repo root, no env is needed:

```sh
cd /absolute/path/to/your/notit-notes-repo
node /absolute/path/to/notit-monorepo/packages/notit-mcp/server.js
```

## Codex

```sh
codex mcp add notit \
  --env NOTIT_REPO_DIR=/absolute/path/to/your/notit-notes-repo \
  -- node /absolute/path/to/notit-monorepo/packages/notit-mcp/server.js
```

Tools:

- `list_notes`
- `search_notes`
- `read_note`
- `write_note`
- `note_history`
