'use client';

/**
 * AI Workflow Chat Component
 *
 * Chat interface for generating workflows using AI
 */

import { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  Check,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { WorkflowFlowNode, WorkflowFlowEdge, WorkflowNodeData } from './types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  workflow?: GeneratedWorkflow;
  timestamp: Date;
}

interface GeneratedWorkflow {
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    config: Record<string, unknown>;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  explanation: string;
}

interface AIWorkflowChatProps {
  onApplyWorkflow: (nodes: WorkflowFlowNode[], edges: WorkflowFlowEdge[]) => void;
}

export function AIWorkflowChat({ onApplyWorkflow }: AIWorkflowChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Convert API response to editor format
  const convertToEditorFormat = (workflow: GeneratedWorkflow): {
    nodes: WorkflowFlowNode[];
    edges: WorkflowFlowEdge[];
  } => {
    const nodes: WorkflowFlowNode[] = workflow.nodes.map((node) => ({
      id: node.id,
      type: 'workflow',
      position: node.position,
      data: {
        nodeType: node.type,
        label: node.label,
        config: node.config,
        meta: {
          id: node.type,
          name: node.label,
          description: '',
          category: node.type.split('.')[0] as 'ai' | 'media' | 'action' | 'flow',
          module: node.type.split('.')[0],
          icon: getIconForType(node.type),
          color: getColorForType(node.type),
          inputSchema: {} as never,
        },
      } as WorkflowNodeData,
    }));

    const edges: WorkflowFlowEdge[] = workflow.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    }));

    return { nodes, edges };
  };

  // Get icon name for node type
  const getIconForType = (type: string): string => {
    const iconMap: Record<string, string> = {
      'ai.generateImage': 'image',
      'ai.generateVideo': 'video',
      'ai.generateText': 'message-square',
      'ai.generateEmail': 'mail',
      'media.upload': 'upload',
      'media.download': 'download',
      'media.filter': 'filter',
      'media.merge': 'layers',
      'email.send': 'mail-send',
      'flow.delay': 'clock',
      'flow.approval': 'check-circle',
      'flow.forEach': 'repeat',
    };
    return iconMap[type] || 'file';
  };

  // Get color for node type
  const getColorForType = (type: string): string => {
    const moduleType = type.split('.')[0];
    const colorMap: Record<string, string> = {
      ai: '#ec4899',
      media: '#06b6d4',
      email: '#3b82f6',
      flow: '#a855f7',
    };
    return colorMap[moduleType] || '#6366f1';
  };

  // Send message to AI
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/workflow/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate workflow');
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: data.workflow.explanation,
        workflow: data.workflow,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `抱歉，生成工作流时出错: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply generated workflow to editor
  const handleApply = (workflow: GeneratedWorkflow) => {
    const { nodes, edges } = convertToEditorFormat(workflow);
    onApplyWorkflow(nodes, edges);
    setIsExpanded(false);
  };

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 transition-all duration-300',
        isExpanded ? 'w-96' : 'w-auto'
      )}
    >
      {/* Collapsed button */}
      {!isExpanded && (
        <Button
          onClick={() => setIsExpanded(true)}
          className="gap-2 shadow-lg"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
          AI 生成工作流
        </Button>
      )}

      {/* Expanded chat panel */}
      {isExpanded && (
        <div className="flex h-[500px] flex-col rounded-lg border bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">AI 工作流助手</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquare className="mb-2 h-8 w-8" />
                <p className="text-sm">描述您想要创建的工作流</p>
                <p className="mt-1 text-xs">
                  例如: &ldquo;生成4张产品图片，筛选最好的一张，发送邮件&rdquo;
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col',
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {msg.content}
                    </div>

                    {/* Workflow preview */}
                    {msg.workflow && (
                      <div className="mt-2 w-full rounded-lg border bg-background p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="font-medium">{msg.workflow.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {msg.workflow.nodes.length} 个节点
                          </span>
                        </div>
                        <p className="mb-3 text-xs text-muted-foreground">
                          {msg.workflow.description}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApply(msg.workflow!)}
                            className="flex-1 gap-1"
                          >
                            <Check className="h-3 w-3" />
                            应用
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              /* Could implement preview */
                            }}
                            className="flex-1"
                          >
                            预览
                          </Button>
                        </div>
                      </div>
                    )}

                    <span className="mt-1 text-[10px] text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">正在生成...</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述您的工作流需求..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
