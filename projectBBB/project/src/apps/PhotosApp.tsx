import { useState } from "react";
import { storyData } from "@/data";
import type { Photo } from "@/types";
import { AppHeader } from "@/components/ios/AppHeader";
import { useProgress } from "@/hooks/useProgress";
import { X } from "lucide-react";

export function PhotosApp() {
  const [selected, setSelected] = useState<Photo | null>(null);
  const progress = useProgress();
  const sorted = [...storyData.photos].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex h-full flex-col bg-white">
      <AppHeader title="相册" large />
      <div className="flex-1 overflow-y-auto px-1 pb-4">
        <div className="grid grid-cols-3 gap-0.5">
          {sorted.map((photo) => (
            <button
              key={photo.id}
              onClick={() => {
                setSelected(photo);
                progress.markRead(photo.id, photo.unlocks);
              }}
              className="relative aspect-square overflow-hidden bg-gray-100 active:opacity-80"
            >
              <PhotoThumb src={photo.src} />
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <PhotoViewer photo={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function PhotoThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#b6c6d8] to-[#8fa3bf]">
        <span className="text-[10px] text-white/70">无图</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}

function PhotoViewer({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black">
      <div className="flex h-12 items-center justify-end px-4">
        <button onClick={onClose} className="text-white active:opacity-60">
          <X size={24} />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <PhotoFull src={photo.src} />
      </div>
      <div className="px-6 pb-10">
        <div className="text-[13px] text-white/60">{photo.date}</div>
        <div className="mt-1 text-[15px] leading-snug text-white">
          {photo.description}
        </div>
      </div>
    </div>
  );
}

function PhotoFull({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="aspect-square w-full max-w-[300px] rounded-lg bg-gradient-to-br from-[#3a4a6a] to-[#6a4a5a]" />
    );
  }
  return (
    <img
      src={src}
      alt=""
      className="max-h-full max-w-full rounded-lg object-contain"
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
