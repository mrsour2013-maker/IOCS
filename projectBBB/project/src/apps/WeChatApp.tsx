import { useEffect, useState } from "react";
import { storyData } from "@/data";
import type { Chat, Contact, Message } from "@/types";
import { AppHeader } from "@/components/ios/AppHeader";
import { useProgress } from "@/hooks/useProgress";
import { formatRelative, formatFullDate } from "@/hooks/useClock";
import { ChevronLeft, Search } from "lucide-react";

export function WeChatApp() {
  const [openChatId, setOpenChatId] = useState<string | null>(null);
  const openChat = storyData.chats.find((c) => c.id === openChatId) ?? null;

  if (openChat) {
    return (
      <ChatView
        chat={openChat}
        onBack={() => setOpenChatId(null)}
      />
    );
  }
  return <ChatList onOpen={setOpenChatId} />;
}

function ChatList({ onOpen }: { onOpen: (id: string) => void }) {
  const sorted = [...storyData.chats].sort((a, b) => {
    const aT = a.messages.length ? a.messages[a.messages.length - 1].time : "";
    const bT = b.messages.length ? b.messages[b.messages.length - 1].time : "";
    return bT.localeCompare(aT);
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <AppHeader title="微信" large right={<Search size={20} className="text-gray-500" />} />
      <div className="flex-1 overflow-y-auto">
        {sorted.map((chat) => (
          <ChatRow key={chat.id} chat={chat} onClick={() => onOpen(chat.id)} />
        ))}
        <div className="h-4" />
      </div>
    </div>
  );
}

function ChatRow({ chat, onClick }: { chat: Chat; onClick: () => void }) {
  const last = chat.messages[chat.messages.length - 1];
  const preview = last
    ? last.type === "image"
      ? "[图片]"
      : last.type === "recall"
        ? "撤回了一条消息"
        : last.text ?? ""
    : "";

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-gray-50"
    >
      <Avatar color={chat.color} />
      <div className="min-w-0 flex-1 border-b border-gray-100 pb-2.5">
        <div className="flex items-baseline justify-between">
          <span className="truncate text-[16px] font-medium text-black">
            {chat.title}
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

function ChatView({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const progress = useProgress();
  const contacts = storyData.contacts;
  const memberMap = new Map(contacts.map((c) => [c.id, c]));

  useEffect(() => {
    if (chat.unlocks) progress.markRead(chat.id, chat.unlocks);
  }, [chat.id, chat.unlocks, progress]);

  let lastDate = "";
  return (
    <div className="flex h-full flex-col bg-[#ededed]">
      <div className="relative flex h-[44px] items-center justify-center border-b border-gray-200 bg-[#ededed] px-2">
        <button
          onClick={onBack}
          className="absolute left-2 flex items-center text-[16px] text-black active:opacity-60"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="max-w-[180px] truncate text-[16px] font-medium text-black">
          {chat.title}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {chat.messages.map((msg) => {
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
                color={
                  msg.from === "me"
                    ? "#34c759"
                    : memberMap.get(msg.from)?.color ?? "#888"
                }
                isMe={msg.from === "me"}
              />
            </div>
          );
        })}
        <div className="h-2" />
      </div>
    </div>
  );
}

function Bubble({
  msg,
  fromName,
  color,
  isMe,
}: {
  msg: Message;
  fromName: string;
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

  return (
    <div className={`mb-2.5 flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
      {!isMe && <Avatar color={color} size={36} />}
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
            className={`rounded-lg px-3 py-2 text-[15px] leading-snug ${
              isMe ? "bg-[#34c759] text-white" : "bg-white text-black"
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>
      {isMe && <Avatar color="#34c759" size={36} />}
    </div>
  );
}

function Avatar({ color = "#888", size = 46 }: { color?: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-md text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.36 }}
    >
      {(color || "").slice(1, 3)}
    </div>
  );
}
