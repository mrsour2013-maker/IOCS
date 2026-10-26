import { useMemo, useState } from "react";
import type { MailMessage } from "@/types";
import { storyData } from "@/data";
import { AppHeader } from "@/components/ios/AppHeader";
import { ChevronLeft, ChevronRight, Edit3, Inbox, Mail, Mailbox, Search } from "lucide-react";

type MailTab = "inbox" | "mailboxes";

export function MailApp() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MailTab>("inbox");
  const [readIds, setReadIds] = useState<Set<string>>(
    () => new Set(storyData.mail.filter((message) => message.initialRead).map((message) => message.id)),
  );

  const messages = useMemo(
    () => [...storyData.mail].sort((a, b) => b.date.localeCompare(a.date)),
    [],
  );
  const unreadCount = messages.filter((message) => !readIds.has(message.id)).length;
  const openMessage = messages.find((message) => message.id === openId) ?? null;

  const openMail = (message: MailMessage) => {
    setReadIds((current) => {
      if (current.has(message.id)) return current;
      const next = new Set(current);
      next.add(message.id);
      return next;
    });
    setOpenId(message.id);
  };

  if (openMessage) {
    return <MailDetail message={openMessage} onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {activeTab === "inbox" ? (
        <AppHeader
          title="收件箱"
          large
          right={
            <div className="flex items-center gap-4 text-[#007aff]">
              <button aria-label="搜索" className="active:opacity-60"><Search size={20} /></button>
              <button aria-label="编辑" className="active:opacity-60"><Edit3 size={20} /></button>
            </div>
          }
        />
      ) : (
        <AppHeader title="邮箱" large right={<button className="text-[#007aff] active:opacity-60" aria-label="编辑"><Edit3 size={20} /></button>} />
      )}

      <div className="flex-1 overflow-y-auto">
        {activeTab === "inbox" ? (
          <>
            <div className="px-4 pb-2 text-[13px] text-gray-500">{unreadCount} 封未读邮件</div>
            {messages.map((message) => (
              <MailRow
                key={message.id}
                message={message}
                read={readIds.has(message.id)}
                onClick={() => openMail(message)}
              />
            ))}
          </>
        ) : (
          <MailboxList />
        )}
        <div className="h-5" />
      </div>

      <div className="flex h-[52px] shrink-0 items-center justify-around border-t border-gray-200 bg-white">
        <MailTabButton
          icon={<Inbox size={21} />}
          label="收件箱"
          active={activeTab === "inbox"}
          badge={unreadCount}
          onClick={() => setActiveTab("inbox")}
        />
        <MailTabButton
          icon={<Mailbox size={21} />}
          label="邮箱"
          active={activeTab === "mailboxes"}
          onClick={() => setActiveTab("mailboxes")}
        />
      </div>
    </div>
  );
}

function MailRow({
  message,
  read,
  onClick,
}: {
  message: MailMessage;
  read: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left active:bg-gray-50">
      <div className="flex w-3 shrink-0 items-start justify-center pt-2">
        {!read && <span className="h-2.5 w-2.5 rounded-full bg-[#007aff]" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <span className={`truncate text-[16px] text-black ${read ? "font-normal" : "font-semibold"}`}>
            {message.sender}
          </span>
          <span className="shrink-0 text-[12px] text-gray-500">{formatMailListDate(message.date)}</span>
        </div>
        <div className={`truncate text-[15px] text-black ${read ? "font-normal" : "font-semibold"}`}>
          {message.subject}
        </div>
        <div className="truncate text-[13px] text-gray-500">{message.summary}</div>
      </div>
      <ChevronRight size={16} className="mt-4 shrink-0 text-gray-300" />
    </button>
  );
}

function MailDetail({ message, onBack }: { message: MailMessage; onBack: () => void }) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="relative flex h-[44px] shrink-0 items-center justify-center border-b border-gray-100 bg-white/90 px-2 backdrop-blur-xl">
        <button onClick={onBack} className="absolute left-2 flex items-center text-[16px] text-[#007aff] active:opacity-60">
          <ChevronLeft size={22} />
          <span className="-ml-1">收件箱</span>
        </button>
        <Mail size={18} className="text-[#007aff]" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <h1 className="text-[22px] font-bold leading-tight text-black">{message.subject}</h1>
        <div className="mt-5 flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="min-w-0">
            <div className="text-[16px] font-semibold text-black">{message.sender}</div>
            <div className="mt-0.5 truncate text-[13px] text-gray-500">{message.senderEmail}</div>
            <div className="mt-1 text-[13px] text-gray-500">To: {message.to}</div>
          </div>
          <div className="shrink-0 text-right text-[12px] leading-relaxed text-gray-500">
            {formatMailDetailDate(message.date)}
          </div>
        </div>
        <div className="mt-6 space-y-4 text-[16px] leading-7 text-[#1d1d1f]">
          {message.body.map((paragraph, index) => (
            <p key={`${message.id}-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function MailboxList() {
  return (
    <div className="px-4 pt-2">
      <MailboxRow name="iCloud" address="phuwin@icloud.example" />
      <MailboxRow name="Gmail" address="phuwin@gmail.example" />
      <MailboxRow name="学校邮箱" address="phuwin@imperial.example" />
    </div>
  );
}

function MailboxRow({ name, address }: { name: string; address: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9f3ff] text-[#007aff]"><Mail size={18} /></div>
      <div className="min-w-0 flex-1">
        <div className="text-[16px] font-medium text-black">{name}</div>
        <div className="truncate text-[13px] text-gray-500">{address}</div>
      </div>
      <ChevronRight size={17} className="text-gray-300" />
    </div>
  );
}

function MailTabButton({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`relative flex flex-col items-center gap-0.5 active:opacity-60 ${active ? "text-[#007aff]" : "text-gray-400"}`}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {badge ? <span className="absolute -right-3 -top-1 rounded-full bg-[#ff3b30] px-1.5 text-[10px] font-semibold text-white">{badge}</span> : null}
    </button>
  );
}

function formatMailListDate(value: string): string {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
  }
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatMailDetailDate(value: string): string {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
