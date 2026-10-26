import { useState } from "react";
import { storyData } from "@/data";
import type { Moment } from "@/types";
import { AppHeader } from "@/components/ios/AppHeader";
import { useProgress } from "@/hooks/useProgress";
import { formatRelative } from "@/hooks/useClock";
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";

export function MomentsApp() {
  const progress = useProgress();
  const sorted = [...storyData.moments].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="flex h-full flex-col bg-white">
      <AppHeader title="朋友圈" />
      <div className="flex-1 overflow-y-auto">
        {sorted.map((moment) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            onView={() => progress.markRead(moment.id, moment.unlocks)}
          />
        ))}
        <div className="h-6" />
      </div>
    </div>
  );
}

function MomentCard({ moment, onView }: { moment: Moment; onView: () => void }) {
  return (
    <div className="border-b border-gray-100 px-4 py-3" onClick={onView}>
      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm text-white"
          style={{ background: moment.color ?? "#888" }}
        >
          {moment.author.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-[#576b95]">
            {moment.author}
          </div>
          <div className="mt-1 whitespace-pre-line text-[15px] leading-snug text-black">
            {moment.text}
          </div>

          {moment.images && moment.images.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-1">
              {moment.images.map((img, i) => (
                <Thumb key={i} src={img} />
              ))}
            </div>
          )}

          <div className="mt-2 text-[12px] text-gray-400">
            {formatRelative(moment.time)}
          </div>

          {(moment.likes?.length || moment.comments?.length) && (
            <div className="mt-1.5 rounded-lg bg-[#f7f7f7] px-2.5 py-1.5">
              {moment.likes && moment.likes.length > 0 && (
                <div className="flex items-center gap-1 text-[13px] text-[#576b95]">
                  <Heart size={12} fill="currentColor" className="text-[#576b95]" />
                  <span>{moment.likes.join("，")}</span>
                </div>
              )}
              {moment.comments?.map((c, i) => (
                <div
                  key={i}
                  className={`text-[13px] leading-snug text-black ${
                    moment.likes?.length ? "mt-1 border-t border-gray-200 pt-1" : ""
                  }`}
                >
                  <span className="text-[#576b95]">{c.from}：</span>
                  {c.text}
                </div>
              ))}
            </div>
          )}
        </div>
        <MoreHorizontal size={18} className="text-gray-300" />
      </div>
    </div>
  );
}

function Thumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="aspect-square rounded bg-gradient-to-br from-gray-300 to-gray-400" />
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="aspect-square rounded object-cover"
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
