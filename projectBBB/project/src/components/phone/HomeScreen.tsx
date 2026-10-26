import { storyData } from "@/data";
import type { AppId } from "@/types";
import { AppIconArtwork } from "@/components/ios/AppIconArtwork";
import { useProgress } from "@/hooks/useProgress";
import { useChatStore, getDynamicUnread } from "@/hooks/useChatStore";
import { StatusBar } from "./StatusBar";
import { DynamicIsland } from "./DynamicIsland";
import { HomeIndicator } from "./HomeIndicator";

interface HomeScreenProps {
  onOpenApp: (id: AppId) => void;
}

export function HomeScreen({ onOpenApp }: HomeScreenProps) {
  const { apps } = storyData;
  const { unreadCount } = useProgress();
  useChatStore(); // subscribe to dynamic chat changes
  const gridApps = apps.filter((a) => !a.dock);
  const dockApps = apps.filter((a) => a.dock);

  const totalUnread = (appId: AppId): number => {
    const staticCount = unreadCount(appId);
    if (appId === "line") {
      const dynamicTotal = storyData.chats
        .filter((chat) => !chat.muted)
        .reduce((sum, chat) => sum + getDynamicUnread(chat.id), 0);
      return staticCount + dynamicTotal;
    }
    return staticCount;
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-gradient-to-b from-[#e8ecf2] via-[#dde2eb] to-[#c9d0dd]">
      <DynamicIsland />
      <StatusBar dark />

      {/* app grid */}
      <div className="flex-1 overflow-y-auto px-6 pt-10 pb-4">
        <div className="grid grid-cols-4 gap-x-5 gap-y-6">
          {gridApps.map((app) => (
            <AppIcon
              key={app.id}
              iconKey={app.icon}
              label={app.name}
              unreadCount={totalUnread(app.id as AppId)}
              onClick={() => onOpenApp(app.id as AppId)}
            />
          ))}
        </div>
      </div>

      {/* dock */}
      <div className="mx-3 mb-7 rounded-[28px] bg-white/35 px-3 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-around">
          {dockApps.map((app) => (
            <AppIcon
              key={app.id}
              iconKey={app.icon}
              label={app.name}
              unreadCount={totalUnread(app.id as AppId)}
              noLabel
              onClick={() => onOpenApp(app.id as AppId)}
            />
          ))}
        </div>
      </div>

      <HomeIndicator />
    </div>
  );
}

interface AppIconProps {
  iconKey: string;
  label: string;
  noLabel?: boolean;
  unreadCount?: number;
  onClick: () => void;
}

function AppIcon({ iconKey, label, noLabel, unreadCount = 0, onClick }: AppIconProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5 outline-none"
    >
      <div className="relative transition-transform duration-150 active:scale-90 group-hover:scale-105">
        <AppIconArtwork iconKey={iconKey} size={60} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-semibold leading-none text-white ring-2 ring-white/70">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
      {!noLabel && (
        <span className="max-w-[72px] truncate text-[11px] font-medium text-[#1d1d1f]">
          {label}
        </span>
      )}
    </button>
  );
}
