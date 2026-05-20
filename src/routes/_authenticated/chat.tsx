import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Coach — FitAI" }] }),
  component: Chat,
});

type Msg = { role: "user" | "assistant"; content: string };

function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("chat_messages").select("role, content").eq("user_id", user.id).order("created_at").limit(50);
      if (data) setMessages(data as Msg[]);
    })();
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || sending) return;
    setSending(true);
    const u = await supabase.auth.getUser();
    const s = await supabase.auth.getSession();
    const user = u.data.user;
    const authSession = s.data.session;
    if (!user || !authSession) { setSending(false); return; }

    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "" }]);
    setInput("");

    await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: text });

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authSession.access_token}` },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limit. Try again.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Chat failed");
        setMessages((m) => m.slice(0, -1));
        setSending(false);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, i).replace(/\r$/, "");
          buf = buf.slice(i + 1);
          if (!line.startsWith("data: ")) continue;
          const ss = line.slice(6).trim();
          if (ss === "[DONE]") { done = true; break; }
          try {
            const j = JSON.parse(ss);
            const c = j.choices?.[0]?.delta?.content;
            if (c) {
              assistantText += c;
              setMessages((m) => {
                const next = [...m];
                next[next.length - 1] = { role: "assistant", content: assistantText };
                return next;
              });
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
      if (assistantText) {
        await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: assistantText });
      }
    } catch {
      toast.error("Chat failed");
    } finally {
      setSending(false);
    }
  };

  const QUICK = [
    "Can I skip cardio today?",
    "Best post-workout meal?",
    "Modify my plan — I'm sore",
    "Quick stretch routine",
  ];

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col md:h-screen">
       <header className="border-b border-white/10 px-4 py-4 backdrop-blur">
         <div className="mx-auto flex max-w-3xl items-center gap-3">
           <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-neon glow-neon">
             <Sparkles className="h-4 w-4 text-primary-foreground" />
           </div>
           <div>
             <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>AI Coach</h1>
             <p className="text-xs text-muted-foreground">Knows your profile, plan, and nutrition</p>
           </div>
         </div>
       </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.length === 0 && (
            <div className="mx-auto mt-10 max-w-md text-center text-sm text-muted-foreground">
              <p>Hi! I'm your coach. Ask me anything — workouts, meals, form, motivation.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
               {QUICK.map((q) => (
                   <button key={q} onClick={() => send(q)} className="glass-strong rounded-full px-3 py-1.5 text-xs border border-white/20 hover:bg-white/10 transition-all hover-lift">
                     {q}
                   </button>
                 ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
               <div className={
                 "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-all " +
                 (m.role === "user"
                   ? "bg-gradient-neon text-primary-foreground"
                   : "glass-strong border border-white/20 border-glow")
               }>
                {m.content || (sending ? "…" : "")}
              </div>
            </motion.div>
          ))}
          <div ref={endRef} />
        </div>
      </div>

       <form
         onSubmit={(e) => { e.preventDefault(); send(input); }}
         className="border-t border-white/10 p-3 backdrop-blur"
       >
        <div className="mx-auto flex max-w-3xl gap-2">
           <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your coach…" disabled={sending} className="bg-white/5 border-white/20" />
           <Button type="submit" size="icon" disabled={sending || !input.trim()} className="bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all hover-lift">
             <Send className="h-4 w-4" />
           </Button>
         </div>
      </form>
    </div>
  );
}
