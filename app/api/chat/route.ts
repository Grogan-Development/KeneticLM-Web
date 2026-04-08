import { NextRequest } from "next/server";
import { createSandbox, getSandbox } from "@/lib/daytona";
import { getMinimaxClient, MINIMAX_MODEL } from "@/lib/ai/minimax";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.MINIMAX_API_KEY?.trim()) {
      return Response.json(
        {
          error: "Server configuration",
          details:
            "MINIMAX_API_KEY is not set. Add it in Railway (or .env.local) — see .env.local.example.",
        },
        { status: 503 }
      );
    }
    if (!process.env.DAYTONA_API_KEY?.trim()) {
      return Response.json(
        {
          error: "Server configuration",
          details:
            "DAYTONA_API_KEY is not set. Add it in Railway (or .env.local) — see .env.local.example.",
        },
        { status: 503 }
      );
    }

    const { messages, sandboxId }: { messages: any[]; sandboxId?: string } = await req.json();

    // Get or create sandbox
    let sandbox;
    if (sandboxId) {
      try {
        sandbox = await getSandbox(sandboxId);
      } catch {
        sandbox = await createSandbox();
      }
    } else {
      sandbox = await createSandbox();
    }

    const anthropic = getMinimaxClient();

    const systemMessage = `You are an AI code editor assistant with access to a Daytona sandbox environment. 
You can help users write, read, and modify code files, execute commands, and run code.

Available tools:
- listFiles: List files in a directory
- readFile: Read file contents
- writeFile: Write content to a file
- createDirectory: Create a directory
- executeCommand: Execute shell commands
- codeRun: Execute code snippets
- gitClone: Clone Git repositories
- getPreviewUrl: Get preview URLs for running services

When helping users:
1. Always confirm file operations before executing them
2. Show the results of command execution
3. Offer to run code to test it
4. Suggest improvements and best practices

Sandbox ID: ${sandbox.id}`;

    // MiniMax Anthropic-compatible API expects content blocks, not raw strings (see platform docs).
    const anthropicMessages = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: [{ type: "text" as const, text: String(m.content ?? "") }],
      }));

    if (anthropicMessages.length === 0) {
      return Response.json(
        { error: "Bad request", details: "No user or assistant messages to send." },
        { status: 400 }
      );
    }

    const stream = await anthropic.messages.create({
      model: MINIMAX_MODEL,
      max_tokens: 4096,
      temperature: 0.7,
      messages: anthropicMessages,
      system: systemMessage,
      stream: true,
    });

    // Create a ReadableStream for the response
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type !== "content_block_delta" || !event.delta) continue;
            if (event.delta.type === "text_delta" && "text" in event.delta && event.delta.text) {
              controller.enqueue(new TextEncoder().encode(event.delta.text));
            }
            // thinking_delta and other block types are ignored for plain chat UI
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-sandbox-id": sandbox.id,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
