import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { analyzeFeatureTimeline, analyzeToolingTimeline } from "./tools/git.js";

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
      "Analyze git history and produce a Mermaid timeline of features added",
      {
        repoPath: z.string().optional().describe("Path to git repo (defaults to current directory)"),
        maxCommits: z.number().optional().describe("Max commits to scan (default 2000)"),
      },
      async (args) => {
        try {
          const result = analyzeFeatureTimeline({
            repoPath: args?.repoPath || this.projectPath,
            maxCommits: args?.maxCommits || 2000,
          });
          return {
            content: [
              { type: "text", text: "Mermaid diagram (paste into a Mermaid renderer or markdown):" },
              { type: "text", text: result.mermaid },
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
      "Analyze git history and produce a Mermaid timeline of tooling introduced",
      {
        repoPath: z.string().optional().describe("Path to git repo (defaults to current directory)"),
        maxCommits: z.number().optional().describe("Max commits to scan (default 2000)"),
      },
      async (args) => {
        try {
          const result = analyzeToolingTimeline({
            repoPath: args?.repoPath || this.projectPath,
            maxCommits: args?.maxCommits || 2000,
          });
          return {
            content: [
              { type: "text", text: "Mermaid diagram (paste into a Mermaid renderer or markdown):" },
              { type: "text", text: result.mermaid },
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
