import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, MessageCircle, Clock, Search, ChevronDown, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  getChatStats, getChatLogs, getConversationMessages,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/chat-logs")({
  head: () => ({ meta: [{ title: "AI Chat Logs — FitAI" }] }),
  component: ChatLogs,
});

function ChatLogs() {
  const chatStatsFn = useServerFn(getChatStats);
  const chatLogsFn = useServerFn(getChatLogs);
  const conversationMessagesFn = useServerFn(getConversationMessages);

  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [conversations, setConversations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, any[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});

  const pageSize = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c] = await Promise.all([
        chatStatsFn(),
        chatLogsFn({ data: { search: debouncedSearch, page, pageSize } }),
      ]);
      setStats(s);
      setConversations(c.conversations);
      setTotal(c.total);
    } catch {
      setError("Failed to load chat logs.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleExpand = async (userId: string) => {
    setExpandedUserId(userId);
    if (!messagesMap[userId]) {
      setLoadingMessages((prev) => ({ ...prev, [userId]: true }));
      const messages = await conversationMessagesFn({ data: { userId } });
      setMessagesMap((prev) => ({ ...prev, [userId]: messages }));
      setLoadingMessages((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>AI Chat Logs</h1>
      </motion.div>

      {error ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-4 py-32">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <button onClick={load} className="text-sm text-primary underline underline-offset-4 hover:text-primary/80">
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="glass-strong border-glow">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Conversations", value: stats!.totalConversations.toLocaleString(), icon: MessageSquare, color: "text-purple-400", delay: 0.05 },
            { label: "Avg Messages / Session", value: stats!.avgMessagesPerSession, icon: MessageCircle, color: "text-blue-400", delay: 0.1 },
            { label: "Avg Duration", value: `${stats!.avgDuration} min`, icon: Clock, color: "text-green-400", delay: 0.15 },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: card.delay }}>
              <Card className="glass-strong border-glow hover-lift">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</span>
                    <card.icon className={cn("h-4 w-4", card.color)} />
                  </div>
                  <div className="mt-3 text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-strong border-glow hover-lift">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Common Topics</span>
                  <MessageSquare className="h-4 w-4 text-orange-400" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {stats!.commonTopics.slice(0, 3).map((t: any) => (
                    <Badge key={t.topic} variant="secondary" className="capitalize text-[10px] px-2 py-0.5">
                      {t.topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-8">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card className="glass-strong border-glow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((conv: any) => (
                <Collapsible
                  key={conv.userId}
                  className="contents"
                  open={expandedUserId === conv.userId}
                  onOpenChange={(isOpen) => {
                    if (isOpen) handleExpand(conv.userId);
                    else setExpandedUserId(null);
                  }}
                >
                  <TableRow className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          {conv.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{conv.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{conv.userEmail}</TableCell>
                    <TableCell>{conv.messageCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.lastMessage), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedUserId === conv.userId && "rotate-180")} />
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow>
                      <TableCell colSpan={5} className="p-0">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="border-t border-border/50 px-4 py-4">
                            <ScrollArea className="max-h-96">
                              {loadingMessages[conv.userId] ? (
                                <div className="space-y-4">
                                  {[...Array(3)].map((_, i) => (
                                    <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                                      <Skeleton className={cn("h-16 w-64 rounded-2xl", i % 2 === 0 ? "rounded-br-sm" : "rounded-bl-sm")} />
                                    </div>
                                  ))}
                                </div>
                              ) : messagesMap[conv.userId] && messagesMap[conv.userId].length > 0 ? (
                                <div className="space-y-3">
                                  {messagesMap[conv.userId].map((msg: any) => (
                                    <div
                                      key={msg.id}
                                      className={cn(
                                        "flex flex-col max-w-[80%] px-4 py-2.5",
                                        msg.role === "user"
                                          ? "ml-auto bg-primary/20 rounded-2xl rounded-br-sm"
                                          : "mr-auto bg-muted rounded-2xl rounded-bl-sm",
                                      )}
                                    >
                                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                      <span className="mt-1 text-[10px] text-muted-foreground self-end">
                                        {format(new Date(msg.created_at), "h:mm a")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                  No messages found
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
              ))}
              {conversations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No conversations found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </motion.div>

      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex items-center justify-between"
        >
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
