import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Megaphone, Plus, Trash2, Loader2, AlertCircle, MessageSquare, Calendar } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  getAnnouncements,
  sendAnnouncement,
  deleteAnnouncement,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — FitAI Admin" }] }),
  component: NotificationsPage,
});

function SendDialog({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSent: () => void;
}) {
  const sendFn = useServerFn(sendAnnouncement);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setBody("");
    }
  }, [open]);

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Message body is required");
      return;
    }
    setSending(true);
    const result = await sendFn({ data: { title: title.trim(), body: body.trim() } });
    setSending(false);
    if (result.ok) {
      toast.success(result.message);
      onOpenChange(false);
      onSent();
    } else {
      toast.error(result.error ?? "Failed to send");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            New Announcement
          </DialogTitle>
          <DialogDescription>
            Send a notification to all users of the app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. New workout feature available!"
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement message here..."
              rows={5}
            />
          </div>
          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Megaphone className="h-4 w-4 mr-2" />
            Send Announcement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementCard({
  announcement,
  onDeleted,
}: {
  announcement: any;
  onDeleted: () => void;
}) {
  const deleteFn = useServerFn(deleteAnnouncement);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteFn({ data: { id: announcement.id } });
    setDeleting(false);
    if (result.ok) {
      toast.success(result.message);
      onDeleted();
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-2xl border border-border/50 bg-card p-5 transition-all hover:border-border/80"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{announcement.title}</h3>
            <Badge variant="secondary" className="text-[10px]">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(announcement.createdAt), "MMM d, yyyy")}
            </Badge>
          </div>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {announcement.body}
          </p>
          <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {announcement.createdBy}
            </span>
            <span>
              {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}

function NotificationsPage() {
  const announcementsFn = useServerFn(getAnnouncements);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await announcementsFn();
      setAnnouncements(result);
    } catch {
      setError("Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [announcementsFn]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-6 h-32 w-full rounded-xl" />
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <button onClick={load} className="text-sm text-primary underline underline-offset-4 hover:text-primary/80">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            Notifications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Send announcements to all users
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 space-y-4"
      >
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Megaphone className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">No announcements yet</p>
              <p className="text-xs text-muted-foreground/60">
                Create your first announcement to notify users
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> New Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} onDeleted={load} />
          ))
        )}
      </motion.div>

      <SendDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSent={load}
      />
    </div>
  );
}
