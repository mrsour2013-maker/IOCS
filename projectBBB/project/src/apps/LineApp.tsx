import { useEffect, useRef, useState } from "react";
import { storyData } from "@/data";
import type { Chat, Message } from "@/types";
import { AppHeader } from "@/components/ios/AppHeader";
import { useProgress } from "@/hooks/useProgress";
import {
  useChatStore,
  getChatsWithDynamic,
  getChatWithDynamic,
  getDynamicUnread,
  appendChatMessage,
  markChatOpened,
} from "@/hooks/useChatStore";
import {
  useStoryEvents,
  setFortPhase,
} from "@/hooks/useStoryEvents";
import {
  fortStoryBeats,
  beatToMessage,
  fortNotificationMessage,
} from "@/data/fortStory";
import { formatRelative, formatFullDate } from "@/hooks/useClock";
import { IOSKeyboard } from "@/components/phone/IOSKeyboard";
import { haptic } from "@/utils/audio";
import { ChevronLeft, PhoneMissed, Pin, Settings } from "lucide-react";

interface LineAppProps {
  /** when set, LINE opens directly into this chat (used by the Fort notification) */
  initialChatId?: string | null;
  /** called when the initial-chat navigation is consumed */
  onInitialChatConsumed?: () => void;
}

/**
 * LINE messaging app. Reads from the same chats/contacts data model, with
 * dynamic in-session messages overlaid via useChatStore. Visual style
 * follows LINE: white background, green accents, rounded avatars, green
 * outgoing bubbles, white incoming bubbles.
 */
export function LineApp({ initialChatId, onInitialChatConsumed }: LineAppProps) {
  const [openChatId, setOpenChatId] = useState<string | null>(initialChatId ?? null);

  // consume initial chat id on mount
  useEffect(() => {
    if (initialChatId) {
      setOpenChatId(initialChatId);
      onInitialChatConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openChat = getChatWithDynamic(openChatId ?? "") ?? null;

  if (openChat) {
    return <ChatView chat={openChat} onBack={() => setOpenChatId(null)} />;
  }
  return <ChatList onOpen={setOpenChatId} />;
}

function ChatList({ onOpen }: { onOpen: (id: string) => void }) {
  useChatStore(); // subscribe to dynamic message changes
  const progress = useProgress();
  const chats = getChatsWithDynamic();
  const sorted = [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const aT = a.messages.length ? a.messages[a.messages.length - 1].time : "";
    const bT = b.messages.length ? b.messages[b.messages.length - 1].time : "";
    return bT.localeCompare(aT);
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <AppHeader
        title="LINE"
        large
        right={<Settings size={20} className="text-gray-500" />}
      />
      <div className="flex-1 overflow-y-auto">
        {sorted.map((chat) => {
          const staticUnread = progress.unreadCount("line", chat.id);
          const dynamicUnread = getDynamicUnread(chat.id);
          const unread = staticUnread + dynamicUnread;
          return (
            <ChatRow
              key={chat.id}
              chat={chat}
              unreadCount={unread}
              onClick={() => onOpen(chat.id)}
            />
          );
        })}
        <div className="h-4" />
      </div>
    </div>
  );
}

function ChatRow({
  chat,
  unreadCount,
  onClick,
}: {
  chat: Chat;
  unreadCount: number;
  onClick: () => void;
}) {
  const last = chat.messages[chat.messages.length - 1];
  const preview = last
    ? last.type === "image"
      ? "[图片]"
      : last.type === "recall"
        ? "撤回了一条消息"
        : last.type === "call"
          ? "未接来电"
          : last.text ?? ""
    : "";

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-gray-50"
    >
      <div className="relative">
        <Avatar avatar={chat.avatar} color={chat.color} />
        {unreadCount > 0 && !chat.muted && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 border-b border-gray-100 pb-2.5">
        <div className="flex items-baseline justify-between">
          <span className={`flex min-w-0 items-center gap-1 truncate text-[16px] ${unreadCount > 0 ? "font-semibold" : "font-medium"} text-black`}>
            {chat.pinned && <Pin size={13} className="shrink-0 text-gray-400" />}
            <span className="truncate">{chat.title}</span>
            {chat.muted && unreadCount > 0 && (
              <span className="shrink-0 text-[11px] font-medium text-gray-400">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </span>
          <span className="ml-2 shrink-0 text-[12px] text-gray-400">
            {last ? formatRelative(last.time) : ""}
          </span>
        </div>
        <div className="truncate text-[13px] text-gray-500">{preview}</div>
      </div>
    </button>
  );
}

// --- Fort story runner ----------------------------------------------------

type FortRunnerState =
  | "idle" // not the Fort story chat, or story not active
  | "fortTyping" // Fort "……" indicator showing
  | "waitingForMe" // waiting for player to tap input bar
  | "meTyping" // keyboard typing animation playing
  | "complete"; // all beats delivered

function useFortStoryRunner(chatId: string, isOpen: boolean) {
  useChatStore(); // subscribe to dynamic message changes so we re-render on append
  const { fortPhase } = useStoryEvents();
  const [runnerState, setRunnerState] = useState<FortRunnerState>("idle");
  const [showTyping, setShowTyping] = useState(false);
  const [meDraft, setMeDraft] = useState<string | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const startBeat = 1; // beat 0 is the notification message, inserted up-front
  const totalBeats = fortStoryBeats.length;

  // Fresh read of which beat ids are already in the chat.
  const computeInsertedIds = (): Set<string> => {
    const chat = getChatWithDynamic(chatId);
    return new Set(chat?.messages.map((m) => m.id) ?? []);
  };

  const computeNextBeat = (): number => {
    const inserted = computeInsertedIds();
    for (let i = startBeat; i < totalBeats; i++) {
      if (!inserted.has(fortStoryBeats[i].messageId)) return i;
    }
    return totalBeats;
  };

  // The main effect: (re)start the runner whenever the chat is open and the
  // story phase is active, but only if there is work to do and no typing
  // timer is currently running.
  useEffect(() => {
    if (!isOpen) {
      activeRef.current = false;
      return;
    }
    if (chatId !== "chat_fort") return;
    if (fortPhase !== "fortChatOpened" && fortPhase !== "conversationComplete") return;

    markChatOpened(chatId);

    if (fortPhase === "conversationComplete") {
      setRunnerState("complete");
      return;
    }

    // Don't start a new beat if a Fort typing timer is running or waiting for me
    if (activeRef.current) return;
    activeRef.current = true;
    runFromCurrent();

    return () => {
      activeRef.current = false;
      if (typingTimerRef.current !== null) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, chatId, fortPhase]);

  const runFromCurrent = () => {
    const nextIdx = computeNextBeat();
    if (nextIdx >= totalBeats) {
      setRunnerState("complete");
      setShowTyping(false);
      setFortPhase("conversationComplete");
      activeRef.current = false;
      return;
    }
    const beat = fortStoryBeats[nextIdx];
    if (beat.sender === "fort") {
      runFortBeat(nextIdx);
    } else {
      setRunnerState("waitingForMe");
      setShowTyping(false);
    }
  };

  const runFortBeat = (idx: number) => {
    setRunnerState("fortTyping");
    setShowTyping(true);
    typingTimerRef.current = window.setTimeout(() => {
      if (!activeRef.current) return;
      typingTimerRef.current = null;
      setShowTyping(false);
      const beat = fortStoryBeats[idx];
      appendChatMessage("chat_fort", beatToMessage(beat));
      haptic(6);
      runFromCurrent();
    }, 2000);
  };

  const onInputTap = () => {
    if (runnerState !== "waitingForMe") return;
    const nextIdx = computeNextBeat();
    if (nextIdx >= totalBeats) return;
    const beat = fortStoryBeats[nextIdx];
    if (beat.sender !== "me") return;
    setMeDraft(beat.text);
    setRunnerState("meTyping");
  };

  const onMeSent = () => {
    const nextIdx = computeNextBeat();
    if (nextIdx >= totalBeats) return;
    const beat = fortStoryBeats[nextIdx];
    if (beat.sender === "me") {
      appendChatMessage("chat_fort", beatToMessage(beat));
      haptic(6);
    }
    setMeDraft(null);
    setRunnerState("idle");
    runFromCurrent();
  };

  return {
    runnerState,
    showTyping,
    meDraft,
    onInputTap,
    onMeSent,
  };
}

// --- Chat view ------------------------------------------------------------

function ChatView({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  useChatStore(); // subscribe
  const progress = useProgress();
  const contacts = storyData.contacts;
  const memberMap = new Map(
    [...contacts, ...(chat.memberProfiles ?? [])].map((contact) => [contact.id, contact]),
  );

  // mark static messages read (existing behavior)
  useEffect(() => {
    progress.markItemRead("line", chat.id, chat.unlocks);
  }, [chat.id, chat.unlocks, progress.markItemRead]);

  const isFortStoryChat = chat.id === "chat_fort";
  const fortRunner = useFortStoryRunner(chat.id, true);
  const liveChat = getChatWithDynamic(chat.id) ?? chat;

  // auto-scroll to bottom on new messages / typing
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [liveChat.messages.length, fortRunner.showTyping, fortRunner.runnerState, fortRunner.meDraft]);

  let lastDate = "";
  const showKeyboard = fortRunner.runnerState === "meTyping" && fortRunner.meDraft !== null;
  const showInputBar = isFortStoryChat && fortRunner.runnerState === "waitingForMe";

  return (
    <div className="flex h-full flex-col bg-[#a8e6cf]/20">
      <div className="relative flex h-[44px] items-center justify-center border-b border-gray-200 bg-white px-2">
        <button
          onClick={onBack}
          className="absolute left-2 flex items-center text-[16px] text-black active:opacity-60"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="max-w-[180px] truncate text-[16px] font-medium text-black">
          {chat.title}
        </span>
        <button className="absolute right-2 text-gray-400 active:opacity-60">
          <Settings size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3" ref={scrollRef}>
        {liveChat.messages.map((msg) => {
          const dateLabel = formatFullDate(msg.time);
          const showDate = dateLabel !== lastDate;
          lastDate = dateLabel;
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="my-3 text-center text-[11px] text-gray-400">
                  {dateLabel}
                </div>
              )}
              <Bubble
                msg={msg}
                fromName={
                  msg.from === "me"
                    ? "我"
                    : memberMap.get(msg.from)?.name ?? chat.title
                }
                avatar={msg.from === "me" ? "" : memberMap.get(msg.from)?.avatar ?? chat.avatar}
                color={
                  msg.from === "me"
                    ? "#06C755"
                    : memberMap.get(msg.from)?.color ?? chat.color ?? "#888"
                }
                isMe={msg.from === "me"}
              />
            </div>
          );
        })}
        {/* Fort typing indicator */}
        {isFortStoryChat && fortRunner.showTyping && (
          <div className="mb-2.5 flex justify-start gap-2">
            <Avatar avatar={chat.avatar} color={chat.color} size={36} />
            <div className="flex items-center rounded-2xl bg-white px-3 py-2.5">
              <span className="text-[16px] tracking-wide text-gray-400">……</span>
            </div>
          </div>
        )}
        <div className="h-2" />
      </div>

      {/* input bar / keyboard */}
      {isFortStoryChat ? (
        showKeyboard && fortRunner.meDraft !== null ? (
          <IOSKeyboard targetText={fortRunner.meDraft} onSend={fortRunner.onMeSent} />
        ) : (
          <InputBar
            active={showInputBar}
            onTap={fortRunner.onInputTap}
          />
        )
      ) : (
        <InputBar active={false} onTap={() => {}} />
      )}
    </div>
  );
}

function InputBar({ active, onTap }: { active: boolean; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className={`flex h-[44px] items-center gap-2 border-t border-gray-200 bg-white px-3 ${
        active ? "active:bg-gray-50" : "opacity-60"
      }`}
    >
      <div className="flex-1 truncate rounded-full bg-[#f2f2f7] px-3 py-1.5 text-left text-[14px] text-gray-400">
        {active ? "点击输入回复…" : "输入消息"}
      </div>
    </button>
  );
}

function Bubble({
  msg,
  fromName,
  avatar,
  color,
  isMe,
}: {
  msg: Message;
  fromName: string;
  avatar?: string;
  color: string;
  isMe: boolean;
}) {
  if (msg.type === "recall") {
    return (
      <div className="my-1.5 text-center text-[12px] text-gray-400">
        {fromName}撤回了一条消息
      </div>
    );
  }

  if (msg.type === "call") {
    return <CallRecord fromName={fromName} />;
  }

  return (
    <div className={`mb-2.5 flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
      {!isMe && <Avatar avatar={avatar} color={color} size={36} />}
      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
        {!isMe && (
          <div className="mb-0.5 pl-1 text-[11px] text-gray-400">{fromName}</div>
        )}
        {msg.type === "image" ? (
          <img
            src={msg.image}
            alt=""
            className="max-h-[180px] max-w-[220px] rounded-lg object-cover"
            draggable={false}
          />
        ) : (
          <div
            className={`rounded-2xl px-3 py-2 text-[15px] leading-snug ${
              isMe
                ? "bg-[#06C755] text-white"
                : "bg-white text-black"
            }`}
          >
            {msg.text}
          </div>
        )}
        {msg.displayTime && (
          <div className={`mt-1 text-[10px] text-gray-400 ${isMe ? "text-right" : "text-left"}`}>
            {msg.displayTime}
          </div>
        )}
      </div>
    </div>
  );
}

function CallRecord({ fromName }: { fromName: string }) {
  return (
    <div className="my-3 flex items-center justify-center gap-2 text-[13px] text-gray-500">
      <PhoneMissed size={17} strokeWidth={1.8} className="text-[#ff3b30]" />
      <span>{fromName} 未接来电</span>
    </div>
  );
}

function Avatar({
  avatar,
  color = "#888",
  size = 46,
}: {
  avatar?: string;
  color?: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        (color || "").slice(1, 3)
      )}
    </div>
  );
}

export { fortNotificationMessage };
