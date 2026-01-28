# Git Timeline MCP Server

A Model Context Protocol (MCP) server that analyzes your project's git history and generates beautiful, interactive visual timelines. Track your project's evolution by visualizing feature development and tooling adoption over time.

**Important:** Each MCP server instance analyzes a specific git repository. The repository path is specified when starting the server, and all tools operate only on that configured repository for security and clarity.

## Features

📅 **Feature Timeline** - Visualize feature development based on actual code changes

- Analyzes source file modifications to identify feature additions
- Detects domains from file paths, function names, and code patterns
- Groups features by date with intelligent categorization
- Shows actual file names as tags (controllers, services, pages, etc.)

🔧 **Tooling Timeline** - Track technology stack evolution

- Monitors dependencies from package.json changes
- Detects tooling from configuration files (eslint, prettier, docker, etc.)
- Fetches package descriptions from npm registry for context
- Shows only newly introduced tools (filters out version updates)

📊 **Interactive Dashboard** - Central hub for project insights

- Side-by-side comparison of features and tooling
- Quick navigation between timelines
- Responsive design for desktop and mobile
- Beautiful gradient UI with card-based layout

🎯 **Smart Analysis**

- Ignores commit messages (analyzes actual code changes)
- Filters source files only (excludes configs, lock files, docs)
- Intelligent grouping by date and domain
- Multiple cards per day for different feature areas

## Prerequisites

- Node.js >= 18.0.0
- A git repository to analyze
- VS Code with GitHub Copilot (for MCP integration)

## Installation

### Option 1: Install from npm (Recommended)

Install globally to use the CLI command anywhere:

```bash
npm install -g @pramodyadav027/git-timeline-mcp-server

# Then use the CLI command in any git repository
cd /path/to/your/project
git-timeline
```

### Option 2: Local Development/Testing

Clone this repository and install dependencies:

```bash
git clone https://github.com/PramodKumarYadav/git-timeline-mcp-server.git
cd git-timeline-mcp-server
npm install

# Generate timelines
node generate-timelines.js
```

```bash
npx @pramodyadav027/git-timeline-mcp-server
```

Or use without installing via npx:

## Configuration for VS Code

This server integrates with VS Code through the Model Context Protocol (MCP). You can configure it in two ways:

### Option 1: Using npm Package (Recommended)

Add to your VS Code MCP settings (`.vscode/mcp.json` in your workspace):

```json
{
  "mcpServers": {
    "git-timeline": {
      "command": "npx",
      "args": ["@pramodyadav027/git-timeline-mcp-server"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "git-timeline": {
      "command": "git-timeline-mcp-server"
    }
  }
}
```

### Option 2: Using Local Installation

If you cloned the repository locally:

```json
{
  "mcpServers": {
    "git-timeline": {
      "command": "node",
      "args": [
        "/absolute/path/to/git-timeline-mcp-server/server.js"
      ]
    }
  }
}
```

**Important:** Replace `/absolute/path/to/git-timeline-mcp-server/server.js` with the actual absolute path to your cloned `server.js` file.

### Reload VS Code

After adding the configuration, reload VS Code to activate the MCP server.

### Monitoring Multiple Projects

To analyze multiple repositories, add separate server entries:

```json
{
  "mcpServers": {
    "git-timeline-project1": {
      "command": "npx",
      "args": ["@pramodyadav027/git-timeline-mcp-server"]
    },
    "git-timeline-project2": {
      "command": "npx",
      "args": ["@pramodyadav027/git-timeline-mcp-server"]
    }
  }
}
```

Each MCP server instance will analyze the git repository in the workspace where it's invoked.

## Available Tools

The server provides three MCP tools that can be invoked through VS Code Copilot:

### 1. `generateFeatureTimeline`

Analyzes git history and generates a timeline of features added based on actual code changes (not commit messages).

**Parameters:**

- `repoPath` (optional): Path to git repository (defaults to current directory)
- `maxCommits` (optional): Maximum commits to scan (default: 2000)

**Output:**

- Creates `.timeline/FEATURE_TIMELINE.html` - Interactive visual timeline
- Creates `.timeline/FEATURE_TIMELINE.md` - Markdown version
- Returns event summary with file paths

**Detection Method:**

- Analyzes file paths (e.g., `/auth/login.js` → Authentication)
- Extracts function/class names from diffs
- Tracks import statements and code patterns
- Groups by business domain, not technical layers

### 2. `generateToolingTimeline`

Analyzes git history and generates a timeline of tools and libraries introduced.

**Parameters:**

- `repoPath` (optional): Path to git repository (defaults to current directory)
- `maxCommits` (optional): Maximum commits to scan (default: 2000)

**Output:**

- Creates `.timeline/TOOLING_TIMELINE.html` - Interactive visual timeline
- Creates `.timeline/TOOLING_TIMELINE.md` - Markdown version
- Returns event summary with file paths

**Detection Method:**

- Parses package.json diffs for dependency additions
- Detects config files (eslint, prettier, docker, github workflows)
- Fetches package descriptions from npm registry (async)
- Shows only newly introduced tools (filters version updates)

### 3. `generateAllTimelines`

Generates both feature and tooling timelines plus an interactive dashboard.

**Parameters:**

- `repoPath` (optional): Path to git repository (defaults to current directory)
- `maxCommits` (optional): Maximum commits to scan (default: 2000)

**Output:**

- Creates `.timeline/FEATURE_TIMELINE.html`
- Creates `.timeline/FEATURE_TIMELINE.md`
- Creates `.timeline/TOOLING_TIMELINE.html`
- Creates `.timeline/TOOLING_TIMELINE.md`
- Creates `.timeline/index.html` - Interactive dashboard
- Returns combined event summaries

## Usage in VS Code

Once configured with VS Code Copilot, you can ask:

- "Generate a feature timeline for this project"
- "Show me the tooling timeline"
- "Create timelines for my git repository"
- "Analyze the project's development history"
- "Generate all timelines with dashboard"

The tools will automatically analyze the git repository in your current workspace and generate beautiful HTML timelines in the `.timeline/` folder. Open `.timeline/index.html` in your browser to view the interactive dashboard.

## Command Line Usage

You can also generate timelines directly from the command line:

## Architecture

The codebase is organized into modular components for better maintainability:

```ini
git-timeline-mcp-server/
├── server.js                    # MCP server orchestration
├── generate-timelines.js        # CLI entry point
├── tools/
│   ├── git.js                   # Main analyzer coordination
│   ├── detectors/
│   │   ├── features.js          # Feature detection logic
│   │   └── tooling.js           # Tooling detection logic
│   ├── generators/
│   │   └── output.js            # HTML/Markdown generation
│   └── utils/
│       └── git-commands.js      # Git command utilities
├── INSTRUCTIONS_FEATURES.md     # Feature detection specs
├── INSTRUCTIONS_TOOLING.md      # Tooling detection specs
└── package.json
```

### Key Design Principles:

- **Modular Architecture**: Separate concerns (detection, generation, git operations)
- **AI-Enhanced**: Uses LLM for intelligent phase naming based on npm package data
- **Async Operations**: Fetches package information from npm registry asynchronously
- **Security First**: Only operates on configured repository path
- **Source of Truth**: Analyzes actual code changes, not commit messages

```bash
# Generate both timelines with dashboard
node generate-timelines.js

# Or use npm scripts
npm start

# Development mode with auto-reload
npm run dev
```

This will create all timeline files in `.timeline/` directory with a comprehensive dashboard.

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/PramodKumarYadav/git-timeline-mcp-server).

## Related Documentation

- [MCP_SETUP.md](MCP_SETUP.md) - Detailed setup instructions
- [INSTRUCTIONS_FEATURES.md](INSTRUCTIONS_FEATURES.md) - Feature detection specifications
- [INSTRUCTIONS_TOOLING.md](INSTRUCTIONS_TOOLING.md) - Tooling detection specifications

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup:

```bash
# Clone the repository
git clone https://github.com/PramodKumarYadav/git-timeline-mcp-server.git
cd git-timeline-mcp-server

# Install dependencies
npm install

# Test locally
node generate-timelines.js

# Or test with MCP
npm start
```

### Areas for Contribution:

- Additional language support (currently focuses on JS/TS/Python/Java)
- More sophisticated domain detection
- Custom visualization themes
- Performance optimizations for large repositories
- Additional output formats (JSON, CSV, etc.)

## Author

Pramod Kumar Yadav

## License

MIT

## Security

This server only operates on the git repository in your current workspace. The tools:

- Cannot access files outside the repository
- Only read git history (no write operations)
- Generate output files only in `.timeline/` subdirectory
- Do not send data to external services (except npm registry for package descriptions)

For enhanced security:

- Review the configured repository path before running
- Use absolute paths in MCP configuration
- Keep the server code updated

## Troubleshooting

### Common Issues:

**"Not a git repository" error**

- Ensure you're running the tool in a git repository
- Check that `.git` folder exists in the project root

**"No events found"**

- Try increasing `maxCommits` parameter
- Check that your repository has commit history
- Verify that source files exist in the repository

**MCP server not connecting**

- Verify the absolute path in `.vscode/mcp.json` is correct
- Restart VS Code after configuration changes
- Check VS Code Developer Tools console for errors

**Timelines missing features/tools**

- Ensure changes are committed (not just staged)
- Check that file extensions match source patterns
- Review INSTRUCTIONS files for detection logic

## Configuration Options

### Timeline Customization

Modify behavior by editing configuration in the detector files:

**Feature Detection** (`tools/detectors/features.js`):

- Source file patterns (currently: `.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, etc.)
- Domain detection keywords
- Grouping rules

**Tooling Detection** (`tools/detectors/tooling.js`):

- Config file patterns to detect
- Tool categorization logic
- LLM prompt for phase naming

### Visual Customization

Modify appearance by editing the HTML generators (`tools/generators/output.js`):

- Color schemes and gradients
- Card layouts and spacing
- Typography and sizing
- Responsive breakpoints

## How It Works

### Feature Detection Process:

1. **Parse Git History**: Extract commits and their file changes
2. **Filter Source Files**: Exclude configs, lock files, documentation
3. **Analyze File Paths**: Detect domains from directory structure
4. **Extract Code Patterns**: Look at function names, class names, imports
5. **Group by Domain**: Categorize changes by business area
6. **Generate Cards**: Create timeline cards with titles, descriptions, and tags

### Tooling Detection Process:

1. **Parse package.json Diffs**: Track when dependencies were added
2. **Detect Config Files**: Find eslint, prettier, docker, CI/CD configs
3. **Fetch npm Data**: Get package descriptions asynchronously
4. **Filter New Tools**: Ignore version updates, only show new additions
5. **Use LLM for Naming**: Generate intelligent phase names based on tool categories
6. **Group by Date**: Create single card per day with all tools

### Key Differences from Commit-Message Approaches:

❌ **Don't Use**: Commit messages (can be vague, misleading, or incomplete)
✅ **Do Use**: Actual file changes, code patterns, and dependency tracking

## Output Examples

### Feature Timeline

- Groups features by date with intelligent domain detection
- Shows actual file names as tags (e.g., `LoginController`, `PaymentService`)
- Business-focused titles (e.g., "User Authentication" not "Auth Controllers")
- Multiple cards per day when different areas are touched
- Verb + noun style descriptions

### Tooling Timeline

- Tracks when libraries and tools were first introduced
- Fetches descriptions from npm registry for context
- Groups by category (Frontend, Backend, Testing, CI/CD, etc.)
- Shows individual tools as pill-shaped badges
- Filters out version updates (only shows new additions)

### Dashboard

- Side-by-side view of both timelines
- Recent activity summary
- Quick links to detailed timelines
- Responsive design for all screen sizes
- Beautiful gradient background (#667eea to #764ba2)
