"use client";

import { useState, useRef, type FormEvent, type KeyboardEvent } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Folder,
  Terminal,
  Play,
  Loader2,
  Send,
  ChevronRight,
  File,
  Wrench,
  Plus,
  Mic,
  ChevronDown,
  Cloud,
} from "lucide-react";
import Editor from "@monaco-editor/react";
import { cn } from "@/lib/utils";

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  state: "call" | "result";
  result?: Record<string, unknown>;
  args?: Record<string, unknown>;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolInvocations?: ToolInvocation[];
}

export default function EditorPage() {
  const [sandboxId, setSandboxId] = useState<string>();
  const [activeFile, setActiveFile] = useState<{ path: string; content: string } | null>(null);
  const [files] = useState<FileNode[]>([]);
  const [previewUrl] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("minimax-m2.7");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sandboxId,
        }),
      });

      const newSandboxId = response.headers.get("x-sandbox-id");
      if (newSandboxId) {
        setSandboxId(newSandboxId);
      }

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.text();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const onComposerKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleFileSelect = (file: FileNode) => {
    if (file.isDir) return;
    setActiveFile({ path: file.path, content: "" });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";

    return (
      <div key={message.id} className={cn("mb-4 flex", isUser ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[min(92%,32rem)] rounded-lg px-3.5 py-2.5 text-[0.8125rem] leading-relaxed",
            isUser
              ? "bg-secondary text-secondary-foreground"
              : "bg-card/80 text-card-foreground ring-1 ring-border/80"
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <div className="mt-2 space-y-1.5 border-t border-border/50 pt-2">
              {message.toolInvocations.map((tool) => (
                <div key={tool.toolCallId} className="rounded-md bg-muted/50 px-2 py-1.5 font-mono text-[0.65rem]">
                  <div className="mb-0.5 flex items-center gap-1.5 text-muted-foreground">
                    <Wrench className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="text-foreground/90">{tool.toolName}</span>
                    <span className="text-[0.6rem] uppercase tracking-wide">
                      {tool.state === "call" ? "…" : "ok"}
                    </span>
                  </div>
                  {tool.state === "result" && tool.result && (
                    <pre className="max-h-36 overflow-auto text-[0.62rem] text-muted-foreground">
                      {JSON.stringify(tool.result, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFileTree = (nodes: FileNode[], level = 0) =>
    nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: level * 12 }}>
        <button
          type="button"
          onClick={() => handleFileSelect(node)}
          className={cn(
            "flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-[0.8125rem] hover:bg-accent/60",
            activeFile?.path === node.path && "bg-accent/80"
          )}
        >
          {node.isDir ? (
            <>
              <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
              <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </>
          ) : (
            <>
              <span className="w-3 shrink-0" />
              <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.children && node.children.length > 0 && <div>{renderFileTree(node.children, level + 1)}</div>}
      </div>
    ));

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">New thread</span>
          <button
            type="button"
            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
            aria-label="Workspace"
          >
            Kenetic LM
            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {sandboxId && (
            <span className="hidden max-w-[12rem] truncate font-mono text-[0.65rem] text-muted-foreground md:inline">
              {sandboxId.slice(0, 10)}…
            </span>
          )}
          <Button variant="secondary" size="sm" className="h-7 text-xs" disabled={!sandboxId}>
            <Play className="mr-1 h-3 w-3" />
            Run
          </Button>
        </div>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        {/* Left: sessions + files */}
        <ResizablePanel defaultSize={18} minSize={14} maxSize={28} className="min-w-0">
          <div className="flex h-full min-h-0 flex-col border-r border-border bg-sidebar">
            <div className="border-b border-sidebar-border px-3 py-2">
              <p className="text-[0.65rem] text-muted-foreground">Sessions</p>
              <button
                type="button"
                className="mt-1 w-full rounded-md bg-accent/50 px-2 py-1.5 text-left text-[0.8125rem] text-foreground"
              >
                This thread
              </button>
            </div>
            <div className="border-b border-sidebar-border px-3 py-2">
              <p className="mb-1.5 text-[0.65rem] text-muted-foreground">Files</p>
              <ScrollArea className="h-[min(40vh,12rem)]">
                {files.length > 0 ? (
                  renderFileTree(files)
                ) : (
                  <p className="text-[0.75rem] leading-snug text-muted-foreground">No files listed yet.</p>
                )}
              </ScrollArea>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border" />

        {/* Center: chat + composer */}
        <ResizablePanel defaultSize={44} minSize={32} className="min-w-0">
          <div className="flex h-full min-h-0 flex-col bg-background">
            <ScrollArea className="min-h-0 flex-1" ref={scrollRef}>
              <div className="flex min-h-[calc(100%-1px)] flex-col px-4 py-6">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 pb-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                      <Cloud className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h1 className="text-base font-medium text-foreground">Let&apos;s build</h1>
                      <p className="mt-1 text-sm text-muted-foreground">Kenetic LM · Daytona sandbox</p>
                    </div>
                  </div>
                )}
                <div className="mx-auto w-full max-w-2xl flex-1">
                  {messages.map((message) => renderMessage(message))}
                  {isLoading && (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      …
                    </div>
                  )}
                  {error && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error.message}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <div className="shrink-0 border-t border-border bg-card/40 px-3 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSubmit(e);
                }}
                className="mx-auto max-w-2xl space-y-2"
              >
                <div className="rounded-xl border border-border bg-muted/30 ring-1 ring-border/50">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onComposerKeyDown}
                    placeholder="Ask anything — @ files and / commands coming soon."
                    disabled={isLoading}
                    rows={3}
                    className="min-h-[5.5rem] resize-none border-0 bg-transparent px-3 py-2.5 text-[0.8125rem] shadow-none focus-visible:ring-0"
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-border/80 px-2 py-1.5">
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled aria-label="Add">
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger size="sm" className="h-8 border-border/80 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimax-m2.7">MiniMax-M2.7</SelectItem>
                          <SelectItem value="stub">Other (soon)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" disabled aria-label="Voice">
                        <Mic className="h-4 w-4 opacity-50" />
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      disabled={isLoading || !input.trim()}
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-center text-[0.65rem] text-muted-foreground">
                  Enter to send · Shift+Enter newline
                </p>
              </form>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border" />

        {/* Right: editor + terminal */}
        <ResizablePanel defaultSize={38} minSize={28} className="min-w-0">
          <ResizablePanelGroup orientation="vertical" className="min-h-0">
            <ResizablePanel defaultSize={68} minSize={36} className="min-h-0">
              <Tabs defaultValue="editor" className="flex h-full min-h-0 flex-col border-l border-border bg-card/30">
                <TabsList className="h-9 w-full shrink-0 justify-start gap-0 rounded-none border-b border-border bg-transparent px-2">
                  <TabsTrigger
                    value="editor"
                    className="rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {activeFile ? activeFile.path.split("/").pop() : "Editor"}
                  </TabsTrigger>
                  {previewUrl && (
                    <TabsTrigger
                      value="preview"
                      className="rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      Preview
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="editor" className="m-0 min-h-0 flex-1 p-0">
                  {activeFile ? (
                    <div className="h-full min-h-0 bg-[oklch(0.11_0.015_265)] p-0.5">
                      <Editor
                        height="100%"
                        defaultLanguage="typescript"
                        value={activeFile.content}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          fontFamily: "var(--font-mono), ui-monospace, monospace",
                          lineHeight: 1.55,
                          padding: { top: 12 },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          renderLineHighlight: "line",
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[8rem] flex-col items-center justify-center px-6 text-center">
                      <p className="text-sm text-muted-foreground">Pick a file from the tree or ask the assistant to create one.</p>
                    </div>
                  )}
                </TabsContent>

                {previewUrl && (
                  <TabsContent value="preview" className="m-0 min-h-0 flex-1 p-0">
                    <iframe
                      title="Sandbox preview"
                      src={previewUrl}
                      className="h-full min-h-[200px] w-full border-0"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </TabsContent>
                )}
              </Tabs>
            </ResizablePanel>

            <ResizableHandle className="h-px bg-border" />

            <ResizablePanel defaultSize={32} minSize={18} maxSize={52} className="min-h-0">
              <div className="flex h-full min-h-0 flex-col border-l border-t border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
                  <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[0.65rem] text-muted-foreground">Shell</span>
                </div>
                <div className="min-h-0 flex-1 overflow-auto bg-[oklch(0.09_0.015_265)] p-3 font-mono text-[0.75rem] leading-relaxed text-muted-foreground">
                  PTY not connected — run commands via the assistant for now.
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>

      <footer className="flex shrink-0 items-center justify-between border-t border-border px-3 py-1.5 text-[0.65rem] text-muted-foreground">
        <span>Sandbox</span>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/90" aria-hidden />
            Ready
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden font-mono sm:inline">{sandboxId ? `${sandboxId.slice(0, 8)}…` : "No sandbox yet"}</span>
        </span>
      </footer>
    </div>
  );
}
