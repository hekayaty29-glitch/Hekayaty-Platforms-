import { useState, useRef, useEffect } from "react";
import { useFlag } from "@/lib/flags";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SendHorizonal, MessageCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  body: string;
}

export default function HekyChat() {
  const enabled = useFlag("chatbot");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!enabled) return null;

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), sender: "user", body: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionRef.current, message: userMessage.body }),
      });
      if (!res.ok) throw new Error("Chat failed");
      const data = await res.json();
      sessionRef.current = data.session_id;
      const botMessage: ChatMessage = { id: crypto.randomUUID(), sender: "bot", body: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: "bot", body: "Sorry, something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="fixed bottom-6 right-6 rounded-full bg-amber-500 hover:bg-amber-600 shadow-lg">
          <MessageCircle className="h-6 w-6 text-brown-dark" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-midnight-blue text-amber-50 border-amber-500 flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="font-cinzel">Heky – Reading Assistant</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m) => (
            <div key={m.id} className={`p-3 rounded-lg max-w-xs ${m.sender === "user" ? "bg-amber-500 self-end text-brown-dark" : "bg-amber-50/10"}`}>{m.body}</div>
          ))}
          <div ref={endRef} />
        </div>
        <DialogFooter className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask Heky about stories…"
            className="flex-1 rounded-md bg-midnight-blue border border-amber-500 px-3 py-2 focus:outline-none"
          />
          <Button size="icon" disabled={loading} onClick={sendMessage} className="bg-amber-500 hover:bg-amber-600">
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
