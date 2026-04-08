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
  ChevronRight,
  File,
  Wrench,
  Mic,
  ChevronDown,
  Plus,
  Package,
  LayoutDashboard,
  Bug,
  PanelLeft,
  ImageIcon,
  MoreHorizontal,
  SlidersHorizontal,
  Send,
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
              ? "bg-[oklch(0.22_0.02_265)] text-foreground"
              : "bg-[oklch(0.16_0.015_265)] text-foreground ring-1 ring-white/[0.06]"
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <div className="mt-2 space-y-1.5 border-t border-white/[0.06] pt-2">
              {message.toolInvocations.map((tool) => (
                <div key={tool.toolCallId} className="rounded-md bg-black/30 px-2 py-1.5 font-mono text-[0.65rem]">
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

  /** Right rail (editor / shell / file list) only when there is something to show */
  const showWorkspacePanel = Boolean(sandboxId || files.length > 0 || activeFile || previewUrl);

  const renderFileTree = (nodes: FileNode[], level = 0) =>
    nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: level * 12 }}>
        <button
          type="button"
          onClick={() => handleFileSelect(node)}
          className={cn(
            "flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-[0.8125rem] hover:bg-white/[0.06]",
            activeFile?.path === node.path && "bg-white/[0.08]"
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
    <div className="flex h-screen min-h-0 flex-col bg-[oklch(0.09_0.01_265)] text-foreground">
      <div className="flex min-h-0 flex-1">
        {/* Left rail: fixed width outside PanelGroup so it cannot be dragged to ~0 */}
        <aside className="flex h-full w-[15rem] min-w-[15rem] shrink-0 flex-col border-r border-white/[0.06] bg-[oklch(0.085_0.012_265)]">
            <div className="flex items-center gap-1 border-b border-white/[0.06] px-2 py-2">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="Toggle panel">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex flex-col gap-0.5 p-2">
              {[
                { icon: Plus, label: "New session" },
                { icon: Package, label: "Automations", disabled: true },
                { icon: LayoutDashboard, label: "Dashboard", disabled: true },
                { icon: Bug, label: "Bugbot", disabled: true },
              ].map(({ icon: Icon, label, disabled }) => (
                <button
                  key={label}
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-[0.8125rem] text-muted-foreground transition-colors",
                    disabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/[0.06] hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  {label}
                </button>
              ))}
            </nav>
            <div className="flex flex-1 flex-col px-3 py-4">
              <p className="text-center text-[0.75rem] text-muted-foreground/80">No sessions yet</p>
            </div>
            <div className="mt-auto border-t border-white/[0.06] p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/90 text-xs font-semibold text-white">
                  Z
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium leading-tight">You</p>
                  <p className="text-[0.65rem] text-muted-foreground">Kenetic LM</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" aria-label="More">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" aria-label="Filter">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
        </aside>

        <ResizablePanelGroup
          key={showWorkspacePanel ? "with-workspace" : "chat-only"}
          orientation="horizontal"
          className="min-h-0 min-w-0 flex-1"
        >
          {/* Center: landing + chat */}
          <ResizablePanel defaultSize={showWorkspacePanel ? 67 : 100} minSize={showWorkspacePanel ? 36 : 52} className="min-w-0">
          <div className="flex h-full min-h-0 flex-col">
            <ScrollArea className="min-h-0 flex-1" ref={scrollRef}>
              <div className="flex min-h-full flex-col px-6 pb-4 pt-10">
                {/* Workspace context bar; user repo when Git linking exists */}
                <div className="mx-auto mb-8 flex w-full max-w-2xl flex-wrap items-center justify-center gap-2">
                  <span className="max-w-[min(100%,28rem)] truncate text-[0.8125rem] text-muted-foreground">
                    No repository linked
                  </span>
                  <button
                    type="button"
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[0.75rem] text-muted-foreground opacity-70"
                    title="Sandbox context (Git linking coming later)"
                  >
                    Sandbox
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </button>
                  {sandboxId && (
                    <span className="font-mono text-[0.65rem] text-muted-foreground">
                      · {sandboxId.slice(0, 8)}…
                    </span>
                  )}
                </div>

                <div className="mx-auto w-full max-w-2xl flex-1">
                  {messages.map((message) => renderMessage(message))}
                  {isLoading && (
                    <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking…
                    </div>
                  )}
                  {error && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error.message}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            {/* Composer dock — Cursor-style */}
            <div className="shrink-0 px-4 pb-6 pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSubmit(e);
                }}
                className="mx-auto w-full max-w-2xl"
              >
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[oklch(0.13_0.015_265)] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onComposerKeyDown}
                    placeholder="Ask Kenetic to build, fix bugs, explore"
                    disabled={isLoading}
                    rows={4}
                    className="min-h-[7.5rem] resize-none border-0 bg-transparent px-4 py-3.5 text-[0.9375rem] leading-relaxed text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0"
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-2 py-2">
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger
                          size="sm"
                          className="h-8 max-w-[9.5rem] border-0 bg-transparent text-[0.75rem] text-muted-foreground shadow-none hover:bg-white/[0.04]"
                        >
                          <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimax-m2.7">MiniMax M2.7</SelectItem>
                          <SelectItem value="stub">Other (soon)</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="inline-flex h-8 items-center rounded-md px-2 text-[0.75rem] text-muted-foreground/60">
                        MCPs
                        <ChevronDown className="ml-0.5 h-3 w-3" />
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" disabled aria-label="Images">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="submit"
                        size="icon"
                        className="h-9 w-9 rounded-full text-muted-foreground hover:bg-white/[0.08] hover:text-foreground disabled:opacity-40"
                        disabled={isLoading || !input.trim()}
                        aria-label="Send"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-40"
                        disabled
                        aria-label="Voice"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </ResizablePanel>

        {showWorkspacePanel && (
          <>
            <ResizableHandle className="w-px bg-white/[0.06]" />

            {/* Right: workspace — only after sandbox / files / editor / preview exist */}
            <ResizablePanel defaultSize={33} minSize={22} className="min-w-0">
              <div className="flex h-full min-h-0 flex-col border-l border-white/[0.06] bg-[oklch(0.085_0.012_265)]">
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2">
                  <span className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">Workspace</span>
                  <Button variant="secondary" size="sm" className="h-7 text-xs" disabled={!sandboxId}>
                    <Play className="mr-1 h-3 w-3" />
                    Run
                  </Button>
                </div>
                <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
                  <ResizablePanel defaultSize={65} minSize={40} className="min-h-0">
                    <Tabs defaultValue="editor" className="flex h-full min-h-0 flex-col">
                      <TabsList className="h-9 w-full shrink-0 justify-start gap-0 rounded-none border-b border-white/[0.06] bg-transparent px-2">
                        <TabsTrigger
                          value="editor"
                          className="rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-white/40 data-[state=active]:bg-transparent"
                        >
                          {activeFile ? activeFile.path.split("/").pop() : "Editor"}
                        </TabsTrigger>
                        {previewUrl && (
                          <TabsTrigger
                            value="preview"
                            className="rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-white/40 data-[state=active]:bg-transparent"
                          >
                            Preview
                          </TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="editor" className="m-0 min-h-0 flex-1 p-0">
                        {activeFile ? (
                          <div className="h-full min-h-0 bg-[oklch(0.07_0.012_265)] p-0.5">
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
                          <div className="flex h-full min-h-[6rem] flex-col items-center justify-center px-4 text-center">
                            <p className="text-[0.8125rem] text-muted-foreground">Files from the sandbox appear in the left rail when listed.</p>
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

                  <ResizableHandle className="h-px bg-white/[0.06]" />

                  <ResizablePanel defaultSize={35} minSize={18} className="min-h-0">
                    <div className="flex h-full min-h-0 flex-col border-t border-white/[0.06]">
                      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
                        <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[0.65rem] text-muted-foreground">Shell</span>
                      </div>
                      <div className="min-h-0 flex-1 overflow-auto bg-black/40 p-3 font-mono text-[0.75rem] leading-relaxed text-muted-foreground">
                        PTY not connected — use the assistant to run commands.
                      </div>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>

                <div className="shrink-0 border-t border-white/[0.06] px-3 py-2">
                  <p className="text-[0.65rem] text-muted-foreground">Files</p>
                  <ScrollArea className="h-24">
                    {files.length > 0 ? (
                      renderFileTree(files)
                    ) : (
                      <p className="pt-1 text-[0.75rem] text-muted-foreground">None yet</p>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      </div>

      <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.06] bg-[oklch(0.085_0.012_265)] px-4 py-1.5 text-[0.65rem] text-muted-foreground">
        <span>Sandbox</span>
        <span className="font-mono">{sandboxId ? `${sandboxId.slice(0, 10)}…` : "Idle"}</span>
      </footer>
    </div>
  );
}
