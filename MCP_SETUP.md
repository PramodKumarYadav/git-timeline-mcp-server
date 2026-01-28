# MCP Server Setup Guide

## Installation

This MCP server analyzes git history to generate feature and tooling timelines.

## Configuration

Add this to your MCP settings file:

### For VS Code / Claude Desktop

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "git-timeline": {
      "command": "node",
      "args": [
        "/Users/pramodyadav/app-journey/server.js"
      ],
      "cwd": "${workspaceFolder}"
    }
  }
}
```

**Important:** Replace `/Users/pramodyadav/app-journey/server.js` with the absolute path to your `server.js` file.

### For Other MCP Clients

```json
{
  "command": "node",
  "args": ["/absolute/path/to/server.js"],
  "cwd": "${workspaceFolder}"
}
```

## Usage

The server provides three tools:

### 1. `generateFeatureTimeline`

Analyzes git history and generates a timeline of features added (only feature timeline).

**Parameters:**
- `repoPath` (optional): Path to git repository (defaults to current directory)
- `maxCommits` (optional): Maximum commits to scan (default: 2000)

**Output:**
- Creates `.timeline/FEATURE_TIMELINE.html`
- Creates `.timeline/FEATURE_TIMELINE.md`
- Returns Mermaid diagram

### 2. `generateToolingTimeline`

Analyzes git history and generates a timeline of tooling/libraries introduced (only tooling timeline).

**Parameters:**
- `repoPath` (optional): Path to git repository (defaults to current directory)
- `maxCommits` (optional): Maximum commits to scan (default: 2000)

**Output:**
- Creates `.timeline/TOOLING_TIMELINE.html`
- Creates `.timeline/TOOLING_TIMELINE.md`
- Returns Mermaid diagram

### 3. `generateAllTimelines`

Analyzes git history and generates both feature and tooling timelines with a dashboard.

**Parameters:**
- `repoPath` (optional): Path to git repository (defaults to current directory)
- `maxCommits` (optional): Maximum commits to scan (default: 2000)

**Output:**
- Creates `.timeline/FEATURE_TIMELINE.html`
- Creates `.timeline/FEATURE_TIMELINE.md`
- Creates `.timeline/TOOLING_TIMELINE.html`
- Creates `.timeline/TOOLING_TIMELINE.md`
- Creates `.timeline/index.html` (dashboard)
- Returns both Mermaid diagrams

## Example

```
Call: generateFeatureTimeline with repoPath="/path/to/my/project"
```

This will analyze your project's git history and create only the feature timeline in `/path/to/my/project/.timeline/`

```
Call: generateAllTimelines with repoPath="/path/to/my/project"
```

This will create both timelines plus a dashboard view.

## Troubleshooting

### Error: "Cannot read properties of undefined"

**Fixed in latest version.** Ensure you're using the latest code.

### Error: "Not a git repository"

Make sure the `repoPath` parameter points to a directory containing a `.git` folder, or run from within a git repository.

### Debug Logging

The server logs debug information to stderr:
- `[DEBUG] Using repo path: ...` - Shows which directory is being analyzed
- `[ERROR] ...` - Shows any errors with stack traces

Check your MCP client logs to see these messages.

## Requirements

- Node.js 18+
- Git installed and available in PATH
- Repository must be a valid git repository

## Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "zod": "^3.25.0"
}
```

Install with:
```bash
npm install
```
