# MCP Git Timeline Server

An MCP server that analyzes your project's git history and generates visual timelines (Mermaid) for:

- Features added (using conventional commit `feat:` and similar heuristics)
- Tooling introduced (ESLint, Prettier, TypeScript, CI, Docker, etc.)

## Quick Start

1. Run the Node.js stdio server:

```bash
node server.js
```

2. Configure MCP client (VS Code Copilot / Inspector)

This repo includes `.vscode/mcp.json` with a stdio server entry named `git-history-timeline` that runs `node server.js`.

## Tools

- `generateFeatureTimeline`:
  - Input: `{ repoPath?: string, maxCommits?: number }`
  - Output: Mermaid `timeline` diagram and structured JSON events
- `generateToolingTimeline`:
  - Input: `{ repoPath?: string, maxCommits?: number }`
  - Output: Mermaid `timeline` diagram and structured JSON events

## Mermaid Example

The server returns Mermaid text like:

```
timeline
  title Feature Timeline
  2025-01-02 : feat: add authentication
  2025-02-10 : feat: profile page : feat: settings
```

Render it in any Mermaid-compatible viewer or Markdown.

## Architecture

- `server.js` – MCP server using `@modelcontextprotocol/sdk` with stdio transport
- `tools/git.js` – Git analysis utilities using native `git` commands via `execSync`

## Notes

- Tooling detection uses file and dependency patterns (e.g., `.eslintrc`, `tsconfig.json`, `.github/workflows/*`, `Dockerfile`, `eslint` dep, etc.).
- Feature detection prefers conventional commits (`feat:`) and simple heuristics.
- You can limit analysis with `maxCommits` for large repos.
