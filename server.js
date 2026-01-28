import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { analyzeFeatureTimeline, analyzeToolingTimeline, generateDashboard, generateAllTimelines } from "./tools/git.js";

export class GitTimelineServer {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.server = new McpServer(
      { name: "git-history-timeline", version: "1.0.0" },
      { capabilities: { tools: {} } }
    );
    this.setupTools();
    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupTools() {
    // Register generateFeatureTimeline tool
    this.server.tool(
      "generateFeatureTimeline",
      "Analyze git history and generate a timeline of features added. Creates HTML and Markdown files in .timeline/ folder.",
      {
        repoPath: z.string().optional().describe("Path to git repo (defaults to current directory)"),
        maxCommits: z.number().optional().describe("Max commits to scan (default 2000)"),
      },
      async (args) => {
        try {
          // Use provided path or current working directory where MCP is called from
          const repoPath = args?.repoPath || process.cwd();
          console.error(`[DEBUG] Using repo path: ${repoPath}`);
          
          const features = analyzeFeatureTimeline({
            repoPath,
            maxCommits: args?.maxCommits || 2000,
          });
          
          return {
            content: [
              { type: "text", text: `Generated ${features.events.length} feature phases. Files saved to ${repoPath}/.timeline/ folder.` },
              { type: "text", text: `Open ${repoPath}/.timeline/FEATURE_TIMELINE.html to view the timeline.` },
            ],
          };
        } catch (error) {
          console.error(`[ERROR] ${error?.stack || error}`);
          return {
            content: [{ type: "text", text: `Error: ${error?.message || String(error)}` }],
            isError: true,
          };
        }
      }
    );

    // Register generateToolingTimeline tool
    this.server.tool(
      "generateToolingTimeline",
      "Analyze git history and generate a timeline of tooling introduced. Creates HTML and Markdown files in .timeline/ folder.",
      {
        repoPath: z.string().optional().describe("Path to git repo (defaults to current directory)"),
        maxCommits: z.number().optional().describe("Max commits to scan (default 2000)"),
      },
      async (args) => {
        try {
          // Use provided path or current working directory where MCP is called from
          const repoPath = args?.repoPath || process.cwd();
          console.error(`[DEBUG] Using repo path: ${repoPath}`);
          
          const tooling = await analyzeToolingTimeline({
            repoPath,
            maxCommits: args?.maxCommits || 2000,
          });
          
          return {
            content: [
              { type: "text", text: `Generated ${tooling.events.length} tooling phases. Files saved to ${repoPath}/.timeline/ folder.` },
              { type: "text", text: `Open ${repoPath}/.timeline/TOOLING_TIMELINE.html to view the timeline.` },
            ],
          };
        } catch (error) {
          console.error(`[ERROR] ${error?.stack || error}`);
          return {
            content: [{ type: "text", text: `Error: ${error?.message || String(error)}` }],
            isError: true,
          };
        }
      }
    );

    // Register generateAllTimelines tool
    this.server.tool(
      "generateAllTimelines",
      "Analyze git history and produce both feature and tooling timelines with a dashboard. Generates HTML/Markdown files in .timeline/ folder including index.html dashboard.",
      {
        repoPath: z.string().optional().describe("Path to git repo (defaults to current directory)"),
        maxCommits: z.number().optional().describe("Max commits to scan (default 2000)"),
      },
      async (args) => {
        try {
          // Use provided path or current working directory where MCP is called from
          const repoPath = args?.repoPath || process.cwd();
          console.error(`[DEBUG] Using repo path: ${repoPath}`);
          
          const features = analyzeFeatureTimeline({
            repoPath,
            maxCommits: args?.maxCommits || 2000,
          });
          
          const tooling = await analyzeToolingTimeline({
            repoPath,
            maxCommits: args?.maxCommits || 2000,
          });
          
          const dashboardPath = generateDashboard(repoPath, features.events, tooling.events);
          
          return {
            content: [
              { type: "text", text: `Generated timelines with ${features.events.length} feature phases and ${tooling.events.length} tooling phases.` },
              { type: "text", text: `Files saved to ${repoPath}/.timeline/ folder (including dashboard).` },
              { type: "text", text: `Open ${repoPath}/.timeline/index.html to view the interactive dashboard.` },
            ],
          };
        } catch (error) {
          console.error(`[ERROR] ${error?.stack || error}`);
          return {
            content: [{ type: "text", text: `Error: ${error?.message || String(error)}` }],
            isError: true,
          };
        }
      }
    );
  }

  async listen() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`[MCP] Git Timeline Server connected via stdio, CWD: ${process.cwd()}`);
  }
}

// Don't use projectPath in constructor, let each tool call determine the repo path
const server = new GitTimelineServer(process.cwd());
await server.listen();
