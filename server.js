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
      "Analyze git history and produce a Mermaid timeline of features added. Also generates HTML files in .timeline/ folder.",
      {
        repoPath: z.string().optional().describe("Path to git repo (defaults to current directory)"),
        maxCommits: z.number().optional().describe("Max commits to scan (default 2000)"),
      },
      async (args) => {
        try {
          const repoPath = args?.repoPath || this.projectPath;
          const features = analyzeFeatureTimeline({
            repoPath,
            maxCommits: args?.maxCommits || 2000,
          });
          // Also generate tooling to create dashboard
          const tooling = analyzeToolingTimeline({ repoPath, maxCommits: args?.maxCommits || 2000 });
          generateDashboard(repoPath, features.events, tooling.events);
          
          return {
            content: [
              { type: "text", text: `Generated ${features.events.length} feature phases. Files saved to .timeline/ folder.` },
              { type: "text", text: "Mermaid diagram:" },
              { type: "text", text: features.mermaid },
            ],
          };
        } catch (error) {
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
      "Analyze git history and produce a Mermaid timeline of tooling introduced. Also generates HTML files in .timeline/ folder.",
      {
        repoPath: z.string().optional().describe("Path to git repo (defaults to current directory)"),
        maxCommits: z.number().optional().describe("Max commits to scan (default 2000)"),
      },
      async (args) => {
        try {
          const repoPath = args?.repoPath || this.projectPath;
          const tooling = analyzeToolingTimeline({
            repoPath,
            maxCommits: args?.maxCommits || 2000,
          });
          // Also generate features to create dashboard
          const features = analyzeFeatureTimeline({ repoPath, maxCommits: args?.maxCommits || 2000 });
          generateDashboard(repoPath, features.events, tooling.events);
          
          return {
            content: [
              { type: "text", text: `Generated ${tooling.events.length} tooling phases. Files saved to .timeline/ folder.` },
              { type: "text", text: "Mermaid diagram:" },
              { type: "text", text: tooling.mermaid },
            ],
          };
        } catch (error) {
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
    console.log(`[MCP] Git Timeline Server connected via stdio`);
  }
}

const server = new GitTimelineServer(process.cwd());
await server.listen();
