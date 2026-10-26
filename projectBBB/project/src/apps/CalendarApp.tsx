import { useState } from "react";
import { storyData } from "@/data";
import type { CalendarEvent } from "@/types";
import { AppHeader } from "@/components/ios/AppHeader";
import { useProgress } from "@/hooks/useProgress";

const MONTHS_ZH = [
  "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
];

export function CalendarApp() {
  const progress = useProgress();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const sorted = [...storyData.events].sort((a, b) => a.date.localeCompare(b.date));

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  return (
    <div className="flex h-full flex-col bg-white">
      <AppHeader title={`${year}年 ${MONTHS_ZH[month]}`} large />
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {sorted.map((event) => {
          const d = new Date(event.date + "T00:00:00");
          return (
            <button
              key={event.id}
              onClick={() => {
                setSelectedEvent(event);
                progress.markRead(event.id, event.unlocks);
              }}
              className="flex w-full items-start gap-3 border-b border-gray-100 py-3 text-left active:bg-gray-50"
            >
              <div className="flex w-12 shrink-0 flex-col items-center">
                <div className="text-[11px] font-medium text-[#ff3b30]">
                  {d.getMonth() + 1}月
                </div>
                <div className="text-[26px] font-light leading-none text-black">
                  {d.getDate()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-medium text-black">
                  {event.title}
                </div>
                {event.time && (
                  <div className="mt-0.5 text-[13px] text-gray-500">
                    {event.time}
                  </div>
                )}
                {event.location && (
                  <div className="text-[13px] text-gray-500">{event.location}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedEvent && (
        <EventSheet event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}

function EventSheet({
  event,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) {
  const d = new Date(event.date + "T00:00:00");
  return (
    <div
      className="absolute inset-0 z-50 flex items-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-2xl bg-white px-5 pb-8 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-gray-300" />
        <div className="text-[12px] text-gray-400">
          {d.getMonth() + 1}月{d.getDate()}日 {event.time ?? "全天"}
        </div>
        <h2 className="mt-1 text-[22px] font-bold text-black">{event.title}</h2>
        {event.location && (
          <div className="mt-2 text-[15px] text-gray-600">📍 {event.location}</div>
        )}
        {event.notes && (
          <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
            {event.notes}
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gray-100 py-2.5 text-[16px] font-medium text-black active:bg-gray-200"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
