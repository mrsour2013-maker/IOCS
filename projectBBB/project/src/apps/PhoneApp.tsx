import { useState } from "react";
import { storyData } from "@/data";
import type { PhoneCall } from "@/types";
import { AppHeader } from "@/components/ios/AppHeader";
import { useProgress } from "@/hooks/useProgress";
import { formatFullDate, formatTime } from "@/hooks/useClock";
import { CallScreen } from "@/apps/CallScreen";
import {
  Phone as PhoneIcon,
  PhoneMissed,
  PhoneIncoming,
  PhoneOutgoing,
  ChevronRight,
  ChevronLeft,
  Video,
  Phone,
} from "lucide-react";

/**
 * iOS Phone recents list + call detail. Reads pre-configured call records
 * from phone-calls.json. Missed calls shown in red. Tapping the call-back
 * button on Pond's missed-call detail starts the Pond call flow, gated on
 * all non-muted LINE chats being read.
 */
export function PhoneApp({ onPondCallEnded }: { onPondCallEnded?: () => void }) {
  const progress = useProgress();
  const [openContactId, setOpenContactId] = useState<string | null>(null);
  const [calling, setCalling] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const sorted = [...storyData.phoneCalls].sort((a, b) =>
    b.time.localeCompare(a.time),
  );

  const contact = openContactId
    ? sorted.find((c) => c.contactId === openContactId)
    : null;
  const contactCalls = openContactId
    ? sorted.filter((c) => c.contactId === openContactId)
    : [];

  /** True when every non-muted LINE chat has zero unread messages. */
  const lineReadComplete = storyData.chats
    .filter((chat) => !chat.muted)
    .every((chat) => progress.unreadCount("line", chat.id) === 0);

  if (calling && contact) {
    const pondContact = storyData.contacts.find((c) => c.id === "pond");
    return (
      <CallScreen
        name={contact.name}
        phone={contact.phone}
        avatar={pondContact?.avatar}
        color={contact.color ?? "#34C759"}
        onEnd={() => setCalling(false)}
        onCallEnded={onPondCallEnded}
      />
    );
  }

  if (contact) {
    const isPondMissed =
      contact.contactId === "pond" &&
      contactCalls.some((c) => c.type === "missed");
    return (
      <>
        <CallDetail
          call={contact}
          calls={contactCalls}
          onBack={() => setOpenContactId(null)}
          canCallBack={isPondMissed}
          onCallBack={() => {
            if (!lineReadComplete) {
              setBlocked(true);
              return;
            }
            setCalling(true);
          }}
        />
        {blocked && (
          <BlockAlert onClose={() => setBlocked(false)} />
        )}
      </>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <AppHeader title="电话" large />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-2 pb-1 text-[15px] font-semibold text-black">
          最近通话
        </div>
        {sorted.map((call) => (
          <CallRow
            key={call.id}
            call={call}
            unread={call.type === "missed" && progress.unreadCount("phone", call.id) > 0}
            onView={() => {
              progress.markItemRead("phone", call.id, call.unlocks);
              setOpenContactId(call.contactId);
            }}
          />
        ))}
        <div className="h-6" />
      </div>
    </div>
  );
}

function CallRow({
  call,
  unread,
  onView,
}: {
  call: PhoneCall;
  unread: boolean;
  onView: () => void;
}) {
  const missed = call.type === "missed";
  const Icon =
    call.type === "missed"
      ? PhoneMissed
      : call.type === "incoming"
        ? PhoneIncoming
        : PhoneOutgoing;

  return (
    <button
      onClick={onView}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-gray-50"
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: call.color ?? "#34C759" }}
      >
        <PhoneIcon size={18} className="text-white" />
      </div>
      <div className="min-w-0 flex-1 border-b border-gray-100 pb-2.5">
        <div className="flex items-center justify-between">
          <span
            className={`truncate text-[16px] ${
              missed ? "font-medium text-[#ff3b30]" : "text-black"
            } ${unread ? "font-semibold" : ""}`}
          >
            {call.name}
          </span>
          <span className="text-[13px] text-gray-400">
            {formatFullDate(call.time)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[13px] text-gray-500">
          <Icon size={13} className={missed ? "text-[#ff3b30]" : "text-gray-400"} />
          <span>{missed ? "未接" : call.type === "incoming" ? "来电" : "已拨"}</span>
          {call.duration && <span> · {call.duration}</span>}
        </div>
      </div>
      {unread && (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff3b30]" />
      )}
      <ChevronRight size={18} className="shrink-0 text-gray-300" />
    </button>
  );
}

function CallDetail({
  call,
  calls,
  onBack,
  canCallBack,
  onCallBack,
}: {
  call: PhoneCall;
  calls: PhoneCall[];
  onBack: () => void;
  canCallBack: boolean;
  onCallBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="relative flex h-[44px] items-center justify-center border-b border-gray-200 px-2">
        <button
          onClick={onBack}
          className="absolute left-2 flex items-center text-[16px] text-[#007aff] active:opacity-60"
        >
          <ChevronLeft size={22} />
          最近通话
        </button>
        <span className="max-w-[180px] truncate text-[16px] font-medium text-black">
          {call.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center px-6 pt-8">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full text-white"
          style={{ background: call.color ?? "#34C759", fontSize: 34 }}
        >
          {call.name.slice(0, 1)}
        </div>
        <div className="mt-4 text-[22px] font-semibold text-black">{call.name}</div>
        <div className="mt-1 text-[15px] text-gray-500">{call.phone}</div>

        <div className="mt-6 flex gap-6">
          {canCallBack ? (
            <ActionIcon
              icon={<Phone size={22} />}
              label="回拨"
              onClick={onCallBack}
            />
          ) : (
            <ActionIcon icon={<Phone size={22} />} label="电话" />
          )}
          <ActionIcon icon={<Video size={22} />} label="视频" />
        </div>

        <div className="mt-8 w-full max-w-[320px]">
          <div className="mb-2 text-[13px] font-medium text-gray-400">通话记录</div>
          <div className="rounded-2xl bg-gray-50">
            {calls.map((c, i) => {
              const missed = c.type === "missed";
              const Icon =
                c.type === "missed"
                  ? PhoneMissed
                  : c.type === "incoming"
                    ? PhoneIncoming
                    : PhoneOutgoing;
              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i !== calls.length - 1 ? "border-b border-gray-200" : ""
                  }`}
                >
                  <Icon
                    size={15}
                    className={missed ? "text-[#ff3b30]" : "text-gray-400"}
                  />
                  <div className="flex-1">
                    <div
                      className={`text-[15px] ${
                        missed ? "text-[#ff3b30]" : "text-black"
                      }`}
                    >
                      {missed ? "未接来电" : c.type === "incoming" ? "来电" : "已拨"}
                      {c.duration && ` · ${c.duration}`}
                    </div>
                    <div className="text-[12px] text-gray-400">
                      {formatFullDate(c.time)} {formatTime(new Date(c.time))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionIcon({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 active:opacity-60"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f7] text-[#007aff]">
        {icon}
      </div>
      <span className="text-[12px] text-[#007aff]">{label}</span>
    </button>
  );
}

function BlockAlert({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-[270px] overflow-hidden rounded-2xl bg-[#f9f9f9] shadow-xl">
        <div className="px-4 py-5 text-center">
          <div className="text-[17px] font-semibold text-black">暂时无法回拨</div>
          <div className="mt-1 text-[13px] leading-snug text-gray-500">
            请先阅读完 LINE 中的未读消息。
          </div>
        </div>
        <div className="flex border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-[16px] font-semibold text-[#007aff] active:bg-gray-100"
          >
            好
          </button>
        </div>
      </div>
    </div>
  );
}
