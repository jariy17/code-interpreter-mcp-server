#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CodeInterpreter } from "bedrock-agentcore/code-interpreter";

// Configuration from environment
const AWS_REGION = process.env.AWS_REGION || "us-west-2";

// Initialize CodeInterpreter client
const codeInterpreter = new CodeInterpreter({
  region: AWS_REGION,
});

// Create MCP server with elicitation capability
const mcpServer = new McpServer(
  {
    name: "tjariy-code-interpreter-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool: execute_code with elicitation for confirmation
mcpServer.registerTool(
  "execute_code",
  {
    description:
      "Execute code in a secure sandboxed environment. Supports Python, JavaScript, and TypeScript.",
    inputSchema: z.object({
      code: z.string().describe("The code to execute"),
      language: z
        .enum(["python", "javascript", "typescript"])
        .default("python")
        .describe("Programming language"),
    }),
  },
  async ({ code, language }) => {
    try {
      // Try to elicit confirmation from the user
      try {
        const confirmation = await mcpServer.server.elicitInput({
          mode: "form",
          message: `About to execute ${language} code. Please review and confirm:`,
          requestedSchema: {
            type: "object",
            properties: {
              confirm: {
                type: "boolean",
                title: "Confirm Execution",
                description: `Execute this ${language} code?\n\n${code.slice(0, 500)}${code.length > 500 ? "..." : ""}`,
                default: true,
              },
            },
            required: ["confirm"],
          },
        });

        if (confirmation.action === "decline") {
          return {
            content: [{ type: "text", text: "Code execution cancelled by user." }],
          };
        }

        if (confirmation.action === "accept" && confirmation.content) {
          const { confirm } = confirmation.content as { confirm: boolean };
          if (!confirm) {
            return {
              content: [{ type: "text", text: "Code execution declined by user." }],
            };
          }
        }
      } catch {
        // Elicitation not supported by client, proceed without confirmation
      }

      const result = await codeInterpreter.executeCode({ code, language });
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: execute_command
mcpServer.registerTool(
  "execute_command",
  {
    description: "Execute a shell command in the sandbox environment",
    inputSchema: z.object({
      command: z.string().describe("The shell command to execute"),
    }),
  },
  async ({ command }) => {
    try {
      const result = await codeInterpreter.executeCommand({ command });
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: read_files
mcpServer.registerTool(
  "read_files",
  {
    description: "Read file contents from the sandbox filesystem",
    inputSchema: z.object({
      paths: z.array(z.string()).describe("Array of file paths to read"),
    }),
  },
  async ({ paths }) => {
    try {
      const result = await codeInterpreter.readFiles({ paths });
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: write_files
mcpServer.registerTool(
  "write_files",
  {
    description: "Write files to the sandbox filesystem",
    inputSchema: z.object({
      files: z
        .array(
          z.object({
            path: z.string().describe("File path"),
            content: z.string().describe("File content"),
          })
        )
        .describe("Array of files to write"),
    }),
  },
  async ({ files }) => {
    try {
      const result = await codeInterpreter.writeFiles({ files });
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: list_files
mcpServer.registerTool(
  "list_files",
  {
    description: "List files in a directory in the sandbox",
    inputSchema: z.object({
      path: z
        .string()
        .default(".")
        .describe("Directory path to list (default: current directory)"),
    }),
  },
  async ({ path }) => {
    try {
      const result = await codeInterpreter.listFiles({ path });
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: remove_files
mcpServer.registerTool(
  "remove_files",
  {
    description: "Remove files from the sandbox filesystem",
    inputSchema: z.object({
      paths: z.array(z.string()).describe("Array of file paths to remove"),
    }),
  },
  async ({ paths }) => {
    try {
      const result = await codeInterpreter.removeFiles({ paths });
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: start_session
mcpServer.registerTool(
  "start_session",
  {
    description: "Start a new code interpreter session",
    inputSchema: z.object({
      name: z.string().optional().describe("Optional session name"),
      timeout: z
        .number()
        .optional()
        .describe("Session timeout in seconds (default: 900)"),
    }),
  },
  async ({ name, timeout }) => {
    try {
      const result = await codeInterpreter.startSession({
        sessionName: name,
        timeout,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: stop_session
mcpServer.registerTool(
  "stop_session",
  {
    description: "Stop the current code interpreter session",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      await codeInterpreter.stopSession();
      return {
        content: [{ type: "text", text: "Session stopped successfully" }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: get_session
mcpServer.registerTool(
  "get_session",
  {
    description: "Get information about a specific session",
    inputSchema: z.object({
      sessionId: z.string().describe("The session ID to query"),
    }),
  },
  async ({ sessionId }) => {
    try {
      const result = await codeInterpreter.getSession({ sessionId });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: list_sessions
mcpServer.registerTool(
  "list_sessions",
  {
    description: "List all code interpreter sessions",
    inputSchema: z.object({
      maxResults: z
        .number()
        .optional()
        .describe("Maximum number of sessions to return"),
    }),
  },
  async ({ maxResults }) => {
    try {
      const result = await codeInterpreter.listSessions({ maxResults });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error("Code Interpreter MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
