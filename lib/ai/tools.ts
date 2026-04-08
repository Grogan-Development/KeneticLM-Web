import { z } from "zod";
import { Sandbox } from "@daytonaio/sdk";
import { tool } from "ai";

/**
 * AI Tools for interacting with Daytona Sandboxes
 * These are hardcoded tools (NOT MCP) that call Daytona's Toolbox API
 */

export interface ToolResult {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export function createTools(sandbox: Sandbox) {
  return {
    listFiles: tool({
      description: "List files and directories in a given path within the sandbox",
      inputSchema: z.object({
        path: z.string().describe("The directory path to list (relative or absolute)"),
      }),
      execute: async ({ path }): Promise<ToolResult> => {
        try {
          const files = await sandbox.fs.listFiles(path);
          return {
            success: true,
            files: files.map((f: { name: string; isDir: boolean; size: number; modTime: string }) => ({
              name: f.name,
              isDir: f.isDir,
              size: f.size,
              modTime: f.modTime,
            })),
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    readFile: tool({
      description: "Read the contents of a file from the sandbox",
      inputSchema: z.object({
        path: z.string().describe("The file path to read (relative or absolute)"),
      }),
      execute: async ({ path }): Promise<ToolResult> => {
        try {
          const content = await sandbox.fs.getFileDetails(path);
          if (content.isDir) {
            return {
              success: false,
              error: "Path is a directory, not a file",
            };
          }
          const fileContent = await sandbox.fs.downloadFile(path);
          return {
            success: true,
            content: fileContent.toString(),
            size: content.size,
            modTime: content.modTime,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    writeFile: tool({
      description: "Create or write content to a file in the sandbox",
      inputSchema: z.object({
        path: z.string().describe("The file path to write (relative or absolute)"),
        content: z.string().describe("The content to write to the file"),
      }),
      execute: async ({ path, content }): Promise<ToolResult> => {
        try {
          await sandbox.fs.uploadFile(path, content);
          return {
            success: true,
            path,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    createDirectory: tool({
      description: "Create a directory in the sandbox",
      inputSchema: z.object({
        path: z.string().describe("The directory path to create"),
        mode: z.string().optional().describe("Permissions in octal format (e.g., '755')"),
      }),
      execute: async ({ path, mode }): Promise<ToolResult> => {
        try {
          await sandbox.fs.createFolder(path, mode || "755");
          return {
            success: true,
            path,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    executeCommand: tool({
      description: "Execute a shell command in the sandbox",
      inputSchema: z.object({
        command: z.string().describe("The command to execute"),
        cwd: z.string().optional().describe("Working directory for the command"),
      }),
      execute: async ({ command, cwd }): Promise<ToolResult> => {
        try {
          const result = await sandbox.process.executeCommand(command, cwd);
          return {
            success: true,
            exitCode: result.exitCode,
            stdout: result.result,
            artifacts: result.artifacts,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    codeRun: tool({
      description: "Execute code in the sandbox with language-specific runtime",
      inputSchema: z.object({
        code: z.string().describe("The code to execute"),
        language: z.enum(["python", "typescript", "javascript"]).describe("The programming language"),
      }),
      execute: async ({ code }): Promise<ToolResult> => {
        try {
          const result = await sandbox.process.codeRun(code);
          return {
            success: true,
            result: result.result,
            exitCode: result.exitCode,
            artifacts: result.artifacts,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    gitClone: tool({
      description: "Clone a Git repository into the sandbox",
      inputSchema: z.object({
        url: z.string().describe("Repository URL"),
        path: z.string().describe("Destination path for the clone"),
        branch: z.string().optional().describe("Branch to clone"),
      }),
      execute: async ({ url, path, branch }): Promise<ToolResult> => {
        try {
          await sandbox.git.clone(url, path, branch);
          return {
            success: true,
            path,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),

    getPreviewUrl: tool({
      description: "Get the public preview URL for a port running in the sandbox",
      inputSchema: z.object({
        port: z.number().describe("The port number to get the preview URL for"),
      }),
      execute: async ({ port }): Promise<ToolResult> => {
        try {
          const previewUrl = `https://${port}-${sandbox.id}.proxy.daytona.io`;
          return {
            success: true,
            previewUrl,
          };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      },
    }),
  };
}

