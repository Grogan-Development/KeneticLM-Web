"use client";

import { useState, useRef } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, MessageSquare, Terminal, Play, Loader2, Send, ChevronRight, File, Wrench } from "lucide-react";
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
  const [files, setFiles] = useState<FileNode[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleFileSelect = async (file: FileNode) => {
    if (file.isDir) {
      return;
    }
    setActiveFile({ path: file.path, content: "" });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === "user";
    
    return (
      <div
        key={message.id}
        className={cn(
          "mb-4 flex",
          isUser ? "justify-end" : "justify-start"
        )}
      >
        <div
          className={cn(
            "max-w-[85%] rounded-lg px-4 py-2",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted border"
          )}
        >
          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
          
          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.toolInvocations.map((tool) => (
                <div
                  key={tool.toolCallId}
                  className="text-xs bg-background/50 rounded p-2"
                >
                  <div className="flex items-center gap-1 text-muted-foreground mb-1">
                    <Wrench className="w-3 h-3" />
                    <span className="font-medium">{tool.toolName}</span>
                    <span className="text-[10px] uppercase">
                      {tool.state === "call" ? "running..." : "done"}
                    </span>
                  </div>
                  {tool.state === "result" && tool.result && (
                    <pre className="text-[10px] overflow-x-auto">
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

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: level * 12 }}>
        <button
          onClick={() => handleFileSelect(node)}
          className={cn(
            "flex items-center gap-1 w-full text-left px-2 py-1 rounded text-sm hover:bg-accent",
            activeFile?.path === node.path && "bg-accent"
          )}
        >
          {node.isDir ? (
            <>
              <ChevronRight className="w-3 h-3" />
              <Folder className="w-4 h-4 text-blue-500" />
            </>
          ) : (
            <>
              <span className="w-3" />
              <File className="w-4 h-4 text-gray-500" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.children && node.children.length > 0 && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-4 py-2 flex items-center justify-between bg-card">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">AI Code Editor</span>
          {sandboxId && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-mono">
              {sandboxId.slice(0, 12)}...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={!sandboxId}>
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* File Explorer */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full flex flex-col border-r bg-card">
            <div className="p-3 border-b">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Explorer
              </h2>
            </div>
            <ScrollArea className="flex-1 p-2">
              {files.length > 0 ? (
                renderFileTree(files)
              ) : (
                <div className="text-sm text-muted-foreground p-2">
                  No files yet. Ask the AI to create some!
                </div>
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Editor + Terminal */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <ResizablePanelGroup orientation="vertical">
            {/* Editor */}
            <ResizablePanel defaultSize={70} minSize={30}>
              <Tabs defaultValue="editor" className="h-full">
                <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 px-2 h-9">
                  <TabsTrigger value="editor" className="text-xs">
                    {activeFile ? activeFile.path.split("/").pop() : "Editor"}
                  </TabsTrigger>
                  {previewUrl && (
                    <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="editor" className="m-0 h-[calc(100%-36px)]">
                  {activeFile ? (
                    <Editor
                      height="100%"
                      defaultLanguage="typescript"
                      value={activeFile.content}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        automaticLayout: true,
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <p className="mb-2">No file selected</p>
                        <p className="text-sm">Ask the AI to create or open a file</p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                {previewUrl && (
                  <TabsContent value="preview" className="m-0 h-[calc(100%-36px)]">
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin"
                    />
                  </TabsContent>
                )}
              </Tabs>
            </ResizablePanel>

            <ResizableHandle />

            {/* Terminal */}
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="h-full flex flex-col border-t bg-card">
                <div className="px-3 py-2 border-b flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span className="text-sm font-semibold">Terminal</span>
                </div>
                <div className="flex-1 bg-black p-2 font-mono text-sm text-green-400 overflow-auto">
                  <div className="text-muted-foreground">
                    Terminal connected to sandbox PTY will appear here.
                    <br />
                    Use the AI chat to execute commands for now.
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle />

        {/* AI Chat */}
        <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
          <div className="h-full flex flex-col border-l bg-card">
            <div className="p-3 border-b">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                AI Assistant
              </h2>
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Ask me to help you write code, explore files, or run commands!
                </div>
              )}
              {messages.map((message) => renderMessage(message))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is thinking...
                </div>
              )}
              {error && (
                <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
                  Error: {error.message}
                </div>
              )}
            </ScrollArea>

            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask the AI to help with code..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
