"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { ImagePlus, Loader2, MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchTenantFeedbackInbox,
  sendTenantFeedbackMessage,
  type TenantFeedbackMessage,
} from "@/lib/actions";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";

const FEEDBACK_IMAGE_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,image/jfif";
const FEEDBACK_MAX_IMAGES = 5;

function formatMessageTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function MessageBubble({ msg }: { msg: TenantFeedbackMessage }) {
  const fromTenant = msg.sender_side === "tenant";
  const label = fromTenant ? msg.sender_username || "You" : "Apex Team";

  return (
    <div
      className={cn(
        "flex max-w-[85%] flex-col gap-1",
        fromTenant ? "ml-auto items-end" : "items-start",
      )}
    >
      <p className="px-1 text-[10px] font-medium text-muted-foreground">{label}</p>
      <div
        className={cn(
          "space-y-2 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
          fromTenant
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border/60 bg-muted text-foreground",
        )}
      >
        {msg.image_url ? (
          <a
            href={msg.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={msg.image_url}
              alt="Attachment"
              className="max-h-48 w-auto object-contain"
            />
          </a>
        ) : null}
        {msg.body ? <p className="whitespace-pre-wrap text-pretty">{msg.body}</p> : null}
      </div>
      <p className="px-1 text-[10px] text-muted-foreground">
        {formatMessageTime(msg.created_at)}
      </p>
    </div>
  );
}

export function TenantFeedbackCenter({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState("");
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [unread, setUnread] = useState(0);
  const [messages, setMessages] = useState<TenantFeedbackMessage[]>([]);
  const [isManager, setIsManager] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickingFileRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const loadInbox = useCallback(
    async (opts?: { silent?: boolean; markRead?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const inbox = await fetchTenantFeedbackInbox({
          markRead: Boolean(opts?.markRead && open),
        });
        setMessages(inbox.messages);
        setUnread(opts?.markRead ? 0 : inbox.unread_from_apex);
        if (open) requestAnimationFrame(scrollToBottom);
      } catch (e) {
        if (!opts?.silent) {
          toast.error(e instanceof Error ? e.message : "Could not load chat");
        }
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [open, scrollToBottom],
  );

  useEffect(() => {
    const role = (localStorage.getItem("Role") || "").toLowerCase();
    setIsManager(role === "manager");
    if (role !== "manager") return;
    void loadInbox({ silent: true });
  }, [loadInbox]);

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    void loadInbox({ markRead: true });
    pollRef.current = setInterval(() => {
      void loadInbox({ silent: true, markRead: true });
    }, 20_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, loadInbox]);

  const canSend =
    Boolean(draft.trim() || pendingImages.length) && !sending && !uploading;
  const atImageLimit = pendingImages.length >= FEEDBACK_MAX_IMAGES;

  const handleSend = async () => {
    const text = draft.trim();
    const images = pendingImages.map((url) => url.trim()).filter(Boolean);
    if ((!text && images.length === 0) || sending || uploading) return;
    setSending(true);
    try {
      if (images.length === 0) {
        await sendTenantFeedbackMessage(text);
      } else {
        for (let i = 0; i < images.length; i++) {
          await sendTenantFeedbackMessage(i === 0 ? text : "", images[i]);
        }
      }
      setDraft("");
      setPendingImages([]);
      await loadInbox({ silent: true, markRead: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send message");
    } finally {
      setSending(false);
    }
  };

  const handleSheetOpenChange = (next: boolean) => {
    if (!next && (uploading || pickingFileRef.current)) return;
    setOpen(next);
  };

  const handlePickImage = () => {
    if (sending || uploading || atImageLimit) return;
    pickingFileRef.current = true;
    const onWindowFocus = () => {
      window.setTimeout(() => {
        pickingFileRef.current = false;
      }, 0);
    };
    window.addEventListener("focus", onWindowFocus, { once: true });
    fileInputRef.current?.click();
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    pickingFileRef.current = false;
    if (files.length === 0) return;

    const remaining = FEEDBACK_MAX_IMAGES - pendingImages.length;
    const selected = files.slice(0, remaining);
    if (files.length > remaining) {
      toast.message(`You can attach up to ${FEEDBACK_MAX_IMAGES} images.`);
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of selected) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        uploaded.push(await uploadImageToCloudinary(file));
      }
      if (uploaded.length) {
        setPendingImages((prev) => [...prev, ...uploaded].slice(0, FEEDBACK_MAX_IMAGES));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!isManager) return null;

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "relative shrink-0 border-white/16 bg-white/6",
            className,
          )}
          aria-label="Chat with Apex"
        >
          <MessageCircle className="size-4" />
          {unread > 0 ? (
            <Badge className="absolute -top-2 -right-3 h-4 min-w-4 px-1 text-[10px]">
              {unread > 9 ? "9+" : unread}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex h-full w-[min(100%,24rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 space-y-1 border-b border-border/60 px-5 py-4 pr-14 text-left">
          <SheetTitle>Feedback center</SheetTitle>
          <SheetDescription>
            Message the Apex team about billing or support. Attach screenshots if needed.
          </SheetDescription>
        </SheetHeader>

        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4"
        >
          {loading && messages.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : null}
          {!loading && messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No messages yet. Say hello to Apex.
            </p>
          ) : null}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </div>

        <div className="shrink-0 space-y-3 border-t border-border/60 p-4">
          {pendingImages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {pendingImages.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className="relative h-16 w-16 overflow-hidden rounded-lg border border-border/60"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5 text-white"
                    onClick={() =>
                      setPendingImages((prev) => prev.filter((_, i) => i !== index))
                    }
                    aria-label="Remove image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={FEEDBACK_IMAGE_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => void handleImageFileChange(e)}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              disabled={sending || uploading || atImageLimit}
              onClick={handlePickImage}
              aria-label="Attach image"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </Button>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              rows={2}
              className="min-h-11 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              className="shrink-0"
              disabled={!canSend}
              onClick={() => void handleSend()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
