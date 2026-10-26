import { useState } from "react";
import { storyData } from "@/data";
import type { Note } from "@/types";
import { AppHeader } from "@/components/ios/AppHeader";
import { useProgress } from "@/hooks/useProgress";
import { formatFullDate } from "@/hooks/useClock";
import { ChevronRight } from "lucide-react";

export function NotesApp() {
  const [openId, setOpenId] = useState<string | null>(null);
  const progress = useProgress();
  const sorted = [...storyData.notes].sort((a, b) => b.time.localeCompare(a.time));
  const open = sorted.find((n) => n.id === openId) ?? null;

  if (open) {
    return <NoteDetail note={open} onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <AppHeader title="备忘录" large />
      <div className="flex-1 overflow-y-auto">
        {sorted.map((note) => (
          <button
            key={note.id}
            onClick={() => {
              setOpenId(note.id);
              progress.markRead(note.id, note.unlocks);
            }}
            className="flex w-full items-center justify-between px-4 py-3 text-left active:bg-gray-50"
          >
            <div className="min-w-0 flex-1 border-b border-gray-100 pb-3">
              <div className="truncate text-[16px] font-medium text-black">
                {note.title}
              </div>
              <div className="mt-0.5 truncate text-[13px] text-gray-400">
                {formatFullDate(note.time)}
                {note.body[0] && ` · ${note.body[0]}`}
              </div>
            </div>
            <ChevronRight size={18} className="ml-2 shrink-0 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

function NoteDetail({ note, onBack }: { note: Note; onBack: () => void }) {
  return (
    <div className="flex h-full flex-col bg-[#fffef5]">
      <AppHeader title="" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-3">
        <div className="text-[11px] text-gray-400">{formatFullDate(note.time)}</div>
        <h1 className="mt-1 text-[24px] font-bold text-black">{note.title}</h1>
        <div className="mt-4 space-y-3">
          {note.body.map((line, i) => (
            <p key={i} className="text-[16px] leading-relaxed text-black">
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
